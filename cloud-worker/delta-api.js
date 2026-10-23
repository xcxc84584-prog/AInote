// BV-Note 3.8.3: content-addressed per-account chunks and immutable file manifests.
const j=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const uid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x||'');
const dig=x=>/^[a-f0-9]{64}$/i.test(x||'');
const CHUNK=256*1024,MAX=100*1024*1024;
const hex=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(v=>v.toString(16).padStart(2,'0')).join('');
async function who(sql,req){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const h=await hex(new TextEncoder().encode(token));const rows=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${h} AND expires_at>NOW() LIMIT 1`;return rows[0]?.user_id||null}
const validPath=(p,dir=false)=>typeof p==='string'&&p.length>0&&p.length<1024&&!p.startsWith('/')&&!p.includes('\\')&&!p.includes('\0')&&p.replace(/\/$/,'').split('/').every(x=>x&&x!=='.'&&x!=='..')&&(!dir||p.endsWith('/'));
export async function deltaApi(req,env,path,sql){if(!path.startsWith('/api/v383/'))return null;
try{
 const user=await who(sql,req);if(!user)return j({error:'請先登入'},401);
 const m=req.method;
 if(path==='/api/v383/chunks/missing'&&m==='POST'){
  const body=await req.json();if(!Array.isArray(body.hashes)||body.hashes.length>1500||body.hashes.some(h=>!dig(h)))return j({error:'無效的分片索引'},400);
  const unique=[...new Set(body.hashes)];const present=await sql`SELECT sha256 FROM bv_delta_chunks WHERE owner_id=${user} AND sha256=ANY(${unique}::text[])`;
  const have=new Set(present.map(x=>x.sha256));return j({missing:unique.filter(h=>!have.has(h))});
 }
 const chunk=path.match(/^\/api\/v383\/chunks\/([a-f0-9]{64})$/i);
 if(chunk){const h=chunk[1].toLowerCase();if(m==='PUT'){
  const bytes=await req.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>CHUNK)return j({error:'分片大小無效'},400);
  if(await hex(bytes)!==h)return j({error:'分片 SHA-256 不符'},422);
  const value=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  await sql`INSERT INTO bv_delta_chunks(owner_id,sha256,data,byte_length) VALUES(${user},${h},decode(${value},'hex'),${bytes.byteLength}) ON CONFLICT(owner_id,sha256) DO NOTHING`;
  return j({ok:true});
 }
 if(m==='GET'){
  const rows=await sql`SELECT encode(data,'hex') AS data,byte_length FROM bv_delta_chunks WHERE owner_id=${user} AND sha256=${h}`;
  if(!rows.length)return j({error:'分片不存在'},404);
  const raw=rows[0].data;const bytes=new Uint8Array(raw.length/2);for(let i=0;i<raw.length;i+=2)bytes[i/2]=parseInt(raw.slice(i,i+2),16);
  return new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store','X-BV-SHA256':h}});
 }
 }
 const file=path.match(/^\/api\/v383\/files\/([0-9a-f-]+)(?:\/(manifest|commit))?$/i);
 if(file&&uid(file[1])){
  const id=file[1];const docs=await sql`SELECT file_id,owner_id,revision,name,life_days,expires_at FROM bv_cloud_documents WHERE file_id=${id} AND owner_id=${user} AND expires_at>NOW()`;
  if(!docs.length)return j({error:'文件不存在或無權限'},404);const doc=docs[0];
  if(file[2]==='manifest'&&m==='GET'){
   const raw=new URL(req.url).searchParams.get('revision');const rev=raw===null?Number(doc.revision):Number(raw);
   if(!Number.isSafeInteger(rev)||rev<1)return j({error:'版本無效'},400);
   const rows=await sql`SELECT revision,manifest,created_at FROM bv_delta_revisions WHERE file_id=${id} AND owner_id=${user} AND revision=${rev}`;
   if(!rows.length)return j({error:'該版本不是增量格式',code:'NOT_DELTA'},404);
   return j({file_id:id,name:doc.name,revision:rev,manifest:rows[0].manifest,created_at:rows[0].created_at});
  }
  if(file[2]==='commit'&&m==='POST'){
   const body=await req.json();const base=body.base_revision;
   if(!Number.isSafeInteger(base)||base<0||base!==Number(doc.revision))return j({error:'雲端版本已更新，請重新載入'},409);
   const entries=body.entries;
   if(!Array.isArray(entries)||entries.length>2000)return j({error:'檔案數量超出限制'},400);
   let size=0;const paths=new Set(),hashes=[];
   for(const e of entries){if(!e||!validPath(e.path,!!e.dir)||paths.has(e.path))return j({error:'無效或重複的路徑'},400);paths.add(e.path);
    if(e.dir){if(e.chunks?.length)return j({error:'目錄不應包含分片'},400);continue}
    if(!Number.isSafeInteger(e.size)||e.size<0||!Array.isArray(e.chunks)||e.chunks.length!==Math.ceil(e.size/CHUNK)||e.chunks.some(h=>!dig(h)))return j({error:'檔案分片索引無效'},400);
    size+=e.size;if(size>MAX)return j({error:'總大小超過 100 MiB'},413);hashes.push(...e.chunks);
   }
   const unique=[...new Set(hashes)];
   const chunkSizes=new Map();
   // Avoid oversized Neon array parameters; check in bounded batches.
   for(let offset=0;offset<unique.length;offset+=500){const batch=unique.slice(offset,offset+500);const rows=await sql`SELECT sha256,byte_length FROM bv_delta_chunks WHERE owner_id=${user} AND sha256=ANY(${batch}::text[])`;const found=new Map(rows.map(r=>[r.sha256,Number(r.byte_length)]));if(batch.some(h=>!found.has(h)))return j({error:'有尚未上傳的分片'},409);for(const [hash,sz] of found)chunkSizes.set(hash,sz)}
   for(const e of entries){if(e.dir)continue;let actual=0;for(let i=0;i<e.chunks.length;i++){const sz=chunkSizes.get(e.chunks[i]);if(i<e.chunks.length-1&&sz!==CHUNK)return j({error:'中間分片大小無效'},400);actual+=sz}if(actual!==e.size)return j({error:'檔案長度與分片不一致'},400)}
   const newRevision=base+1;
   // Conditional revision claim prevents two concurrent commits from both succeeding.
   const changed=await sql`UPDATE bv_cloud_documents SET revision=${newRevision},updated_at=NOW() WHERE file_id=${id} AND owner_id=${user} AND revision=${base} RETURNING revision`;
   if(!changed.length)return j({error:'提交衝突，請重新載入'},409);
   try{await sql`INSERT INTO bv_delta_revisions(file_id,owner_id,revision,manifest) VALUES(${id},${user},${newRevision},${JSON.stringify(entries)}::jsonb)`}
   catch(err){console.error('delta manifest insertion failed',err);await sql`UPDATE bv_cloud_documents SET revision=${base} WHERE file_id=${id} AND owner_id=${user} AND revision=${newRevision}`;throw err}
   return j({ok:true,file_id:id,revision:newRevision,changed_chunks:unique.length});
  }
 }
 return j({error:'未知增量 API'},404);
}catch(e){console.error('v383 delta API',e);return j({error:'增量操作失敗，請檢查 Worker 日誌'},500)}
}
