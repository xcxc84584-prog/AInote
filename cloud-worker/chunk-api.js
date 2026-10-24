import { sha256 } from '@noble/hashes/sha2.js';
import {neon} from '@neondatabase/serverless';
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const idok=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
const hex=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(v=>v.toString(16).padStart(2,'0')).join('');
const partSize=256*1024,legacyPartSize=2*1024*1024,MAX=100*1024*1024;
// Existing v3.7.8–v3.8.0 uploads retain their original 2 MiB boundaries.
const uploadPartSize=u=>Number(u.part_count)===Math.ceil(Number(u.size_bytes)/legacyPartSize)?legacyPartSize:partSize;
const tokenHash=async t=>hex(new TextEncoder().encode(t));
async function owner(sql,req){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const h=await tokenHash(token);const rows=await sql`SELECT s.user_id FROM bv_sessions s WHERE s.token_hash=${h} AND s.expires_at>NOW() LIMIT 1`;return rows[0]?.user_id||null}
export async function chunkApi(req,env,path,sql){if(!path.startsWith('/api/v378/'))return null;
 try{const user=await owner(sql,req);if(!user)return json({error:'需要登入'},401);
 const method=req.method;
 const fmatch=path.match(/^\/api\/v378\/files\/([0-9a-f-]+)(?:\/(history)(?:\/(\d+))?)?$/i);
 if(fmatch&&idok(fmatch[1])&&(method==='DELETE'||fmatch[2]==='history')){
  const fid=fmatch[1];const own=await sql`SELECT file_id,name,revision FROM bv_cloud_documents WHERE file_id=${fid} AND owner_id=${user}`;
  if(!own.length)return json({error:'文件不存在或無權限'},404);
  if(fmatch[2]==='history'&&method==='GET'){
   const revisions=await sql`SELECT revision,sha256,completed_at AS created_at,'full' AS mode,size_bytes FROM bv_cloud_uploads WHERE file_id=${fid} AND owner_id=${user} AND state='complete' UNION ALL SELECT revision,'' AS sha256,created_at,'delta' AS mode,0 AS size_bytes FROM bv_delta_revisions WHERE file_id=${fid} AND owner_id=${user} ORDER BY revision DESC LIMIT 100`;
   return json({name:own[0].name,commits:revisions});
  }
  if(fmatch[2]==='history'&&method==='DELETE'&&fmatch[3]){
   const rev=Number(fmatch[3]);if(!Number.isSafeInteger(rev)||rev<1)return json({error:'版本無效'},400);
   const count=await sql`SELECT (SELECT COUNT(*) FROM bv_cloud_uploads WHERE file_id=${fid} AND owner_id=${user} AND state='complete')+(SELECT COUNT(*) FROM bv_delta_revisions WHERE file_id=${fid} AND owner_id=${user}) AS n`;
   if(count[0].n<=1)return json({error:'最後一個版本不能單獨刪除'},409);
   let removed=await sql`DELETE FROM bv_cloud_uploads WHERE file_id=${fid} AND owner_id=${user} AND revision=${rev} AND state='complete' RETURNING revision`;if(!removed.length)removed=await sql`DELETE FROM bv_delta_revisions WHERE file_id=${fid} AND owner_id=${user} AND revision=${rev} RETURNING revision`;
   if(!removed.length)return json({error:'版本不存在'},404);
   const latest=await sql`SELECT MAX(revision)::int AS revision FROM (SELECT revision FROM bv_cloud_uploads WHERE file_id=${fid} AND owner_id=${user} AND state='complete' UNION ALL SELECT revision FROM bv_delta_revisions WHERE file_id=${fid} AND owner_id=${user}) v`;
   await sql`UPDATE bv_cloud_documents SET revision=${latest[0].revision},updated_at=NOW() WHERE file_id=${fid} AND owner_id=${user}`;
   return json({deleted:true,revision:latest[0].revision});
  }
  if(!fmatch[2]&&method==='DELETE'){
   const removed=await sql`DELETE FROM bv_cloud_documents WHERE file_id=${fid} AND owner_id=${user} RETURNING file_id`;
   return json({deleted:!!removed.length,file_id:fid});
  }
 }
 if(path==='/api/v378/files'&&method==='GET'){const rows=await sql`SELECT file_id,name,revision,life_days,expires_at FROM bv_cloud_documents WHERE owner_id=${user} AND expires_at>NOW() ORDER BY updated_at DESC LIMIT 200`;return json({files:rows})}
 if(path==='/api/v378/uploads'&&method==='POST'){
 const b=await req.json();if(!idok(b.file_id)||typeof b.name!=='string'||!b.name.trim()||b.name.length>240||!Number.isSafeInteger(b.size_bytes)||b.size_bytes<1||b.size_bytes>MAX||!Number.isInteger(b.life_days)||![1,7,14,30,90].includes(b.life_days)||!/^[a-f0-9]{64}$/i.test(b.sha256))return json({error:'上傳資料無效或超過 100 MiB'},400);
 const parts=Math.ceil(b.size_bytes/partSize), existing=await sql`SELECT owner_id,revision FROM bv_cloud_documents WHERE file_id=${b.file_id}`;
 if(existing.length&&existing[0].owner_id!==user)return json({error:'沒有文件權限'},403);
 if(!existing.length)await sql`INSERT INTO bv_cloud_documents(file_id,owner_id,name,life_days,expires_at) VALUES(${b.file_id},${user},${b.name.trim()},${b.life_days},NOW()+(${b.life_days} * INTERVAL '1 day')) ON CONFLICT DO NOTHING`;
 const uploadId=idok(b.upload_id)?b.upload_id:crypto.randomUUID();const prior=await sql`SELECT id,file_id,owner_id,size_bytes,sha256,part_count,state FROM bv_cloud_uploads WHERE id=${uploadId}`;
 if(prior.length){const p=prior[0];if(p.owner_id!==user||p.file_id!==b.file_id||Number(p.size_bytes)!==b.size_bytes||p.sha256!==b.sha256||p.part_count!==parts)return json({error:'續傳參數不符'},409);return json({upload_id:uploadId,part_count:parts,state:p.state})}
 const current=await sql`SELECT revision FROM bv_cloud_documents WHERE file_id=${b.file_id} AND owner_id=${user}`;
 const revision=Number(current[0].revision)+1;
 if(existing.length&&b.base_revision!==undefined&&Number(b.base_revision)!==Number(existing[0].revision))return json({error:'雲端版本已改變，請重新載入後提交'},409);
 await sql`INSERT INTO bv_cloud_uploads(id,file_id,owner_id,revision,size_bytes,part_count,sha256) VALUES(${uploadId},${b.file_id},${user},${revision},${b.size_bytes},${parts},${b.sha256})`;
 return json({upload_id:uploadId,part_count:parts,revision},201)
 }
 const up=path.match(/^\/api\/v378\/uploads\/([0-9a-f-]+)(?:\/(\d+|complete))?$/i);
 if(up&&idok(up[1])){const uploadId=up[1],rows=await sql`SELECT * FROM bv_cloud_uploads WHERE id=${uploadId} AND owner_id=${user}`;if(!rows.length)return json({error:'找不到上傳'},404);const u=rows[0];
 if(!up[2]&&method==='GET'){const parts=await sql`SELECT part_index FROM bv_cloud_parts WHERE upload_id=${uploadId} ORDER BY part_index`;return json({upload_id:uploadId,state:u.state,received:parts.map(p=>p.part_index),part_count:u.part_count})}
 if(/^\d+$/.test(up[2]||'')&&method==='PUT'){const i=Number(up[2]);if(u.state!=='uploading'||i>=u.part_count)return json({error:'上傳已完成或分片索引無效'},409);const data=await req.arrayBuffer();const chunkSize=uploadPartSize(u);const expected=i===u.part_count-1?Number(u.size_bytes)-i*chunkSize:chunkSize;if(data.byteLength!==expected)return json({error:'分片長度不符'},400);const digest=await hex(data);if(digest!==req.headers.get('X-BV-SHA256'))return json({error:'SHA256 不符'},422);
 const bytes=Array.from(new Uint8Array(data)).map(x=>x.toString(16).padStart(2,'0')).join('');
 await sql`INSERT INTO bv_cloud_parts(upload_id,part_index,data,sha256,byte_length) VALUES(${uploadId},${i},decode(${bytes},'hex'),${digest},${data.byteLength}) ON CONFLICT(upload_id,part_index) DO UPDATE SET data=EXCLUDED.data,sha256=EXCLUDED.sha256,byte_length=EXCLUDED.byte_length`;
 return json({ok:true,index:i})}
 if(up[2]==='complete'&&method==='POST'){if(u.state==='complete')return json({ok:true,file_id:u.file_id,revision:u.revision});const p=await sql`SELECT COUNT(*)::int AS n,COALESCE(SUM(byte_length),0)::bigint AS bytes FROM bv_cloud_parts WHERE upload_id=${uploadId}`;if(p[0].n!==u.part_count||Number(p[0].bytes)!==Number(u.size_bytes))return json({error:'分片不完整'},409);
 const hasher=sha256.create();for(let i=0;i<u.part_count;i++){const pieces=await sql`SELECT encode(data,'hex') AS hex,sha256,byte_length FROM bv_cloud_parts WHERE upload_id=${uploadId} AND part_index=${i}`;if(pieces.length!==1)return json({error:'分片不完整'},409);const piece=pieces[0],bytes=new Uint8Array(piece.hex.length/2);for(let j=0;j<piece.hex.length;j+=2)bytes[j/2]=parseInt(piece.hex.slice(j,j+2),16);if(bytes.length!==piece.byte_length||await hex(bytes)!==piece.sha256)return json({error:'分片內容驗證失敗'},422);hasher.update(bytes)}const digest=Array.from(hasher.digest()).map(v=>v.toString(16).padStart(2,'0')).join('');if(digest!==u.sha256)return json({error:'完整 ZIP SHA256 不符'},422);
 const current=await sql`SELECT revision FROM bv_cloud_documents WHERE file_id=${u.file_id} AND owner_id=${user}`;if(!current.length||Number(current[0].revision)!==Number(u.revision)-1)return json({error:'版本衝突：其他提交已更新此文件，請重新載入'},409);await sql`UPDATE bv_cloud_uploads SET state='complete',completed_at=NOW() WHERE id=${uploadId} AND owner_id=${user} AND state='uploading'`;const changed=await sql`UPDATE bv_cloud_documents SET revision=${u.revision},updated_at=NOW(),name=(SELECT name FROM bv_cloud_documents WHERE file_id=${u.file_id}) WHERE file_id=${u.file_id} AND owner_id=${user} AND revision=${u.revision-1} RETURNING revision`;if(!changed.length)return json({error:'版本衝突，請重新載入'},409);return json({ok:true,file_id:u.file_id,revision:u.revision})}
 }
 const file=path.match(/^\/api\/v378\/files\/([0-9a-f-]+)(?:\/(meta|parts\/\d+))?$/i);
 if(file&&idok(file[1])&&method==='GET'){const rows=await sql`SELECT * FROM bv_cloud_documents WHERE file_id=${file[1]} AND owner_id=${user} AND expires_at>NOW()`;if(!rows.length)return json({error:'文件不存在或無權限'},404);const d=rows[0];const requested=new URL(req.url).searchParams.get('revision');const rev=requested===null?null:Number(requested);if(requested!==null&&(!Number.isSafeInteger(rev)||rev<1))return json({error:'版本無效'},400);const u=await sql`SELECT * FROM bv_cloud_uploads WHERE file_id=${d.file_id} AND owner_id=${user} AND state='complete' AND revision=${rev===null?Number(d.revision):rev} ORDER BY revision DESC LIMIT 1`;if(!u.length){const dr=await sql`SELECT revision FROM bv_delta_revisions WHERE file_id=${d.file_id} AND owner_id=${user} AND (${rev}::integer IS NULL OR revision=${rev}) ORDER BY revision DESC LIMIT 1`;if(dr.length&&(!file[2]||file[2]==='meta'))return json({file_id:d.file_id,name:d.name,revision:dr[0].revision,format:'delta',life_days:d.life_days,expires_at:d.expires_at});return json({error:'文件尚未完成上傳'},409)}const v=u[0];if(!file[2]||file[2]==='meta')return json({file_id:d.file_id,name:d.name,revision:v.revision,part_count:v.part_count,size_bytes:Number(v.size_bytes),sha256:v.sha256,life_days:d.life_days,expires_at:d.expires_at});const i=Number(file[2].split('/')[1]);if(!Number.isInteger(i)||i<0||i>=v.part_count)return json({error:'分片不存在'},404);const chunks=await sql`SELECT encode(data,'hex') AS hex,sha256 FROM bv_cloud_parts WHERE upload_id=${v.id} AND part_index=${i}`;if(!chunks.length)return json({error:'分片不存在'},404);const str=chunks[0].hex,bytes=new Uint8Array(str.length/2);for(let j=0;j<str.length;j+=2)bytes[j/2]=parseInt(str.slice(j,j+2),16);return new Response(bytes,{headers:{'Content-Type':'application/octet-stream','X-BV-SHA256':chunks[0].sha256,'Cache-Control':'no-store'}})}
 return json({error:'未知分片 API'},404)
 }catch(e){console.error('v378 API',e);return json({error:'雲端操作失敗，請查看 Worker 日誌'},500)}
}
