// BV-Note v3.8.9.1 user-scoped FHI console.
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function getUser(sql,req){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const hash=await digest(token);const rows=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`;return rows[0]?.user_id||null}
function fail(code,message,status=400){return reply({ok:false,code,error:message},status)}
export async function consoleApi(req,env,path,sql){if(path!=='/api/console/execute')return null;
if(req.method!=='POST')return fail('CMD-405','只允許 POST',405);
try{
const user=await getUser(sql,req);if(!user)return fail('AUTH-401','請先登入 BV-Note',401);
const data=await req.json();const command=String(data?.command||'').trim();if(command.length>500)return fail('CMD-400','命令過長');
if(command==='/help')return reply({ok:true,lines:['/help','/check File-Hash-ID-List','/delete ALL.FHI:<File-Hash-ID>','/delete ID.FHI:<File-Hash-ID>','/delete PART.FHI:<File-Hash-ID><1>','/delete PART.FHI:<File-Hash-ID><[1,4,7]>']});
if(/^\/admin(?:\s|$)/i.test(command)){
 const key=command.match(/^\/admin\s+(.+)$/i)?.[1];if(!key)return fail('ADM-400','請提供管理員金鑰');
 if(!env.BV_CONSOLE_ADMIN_KEY)return fail('ADM-503','管理員驗證尚未設定',503);
 const expected=await digest(env.BV_CONSOLE_ADMIN_KEY),actual=await digest(key);
 if(expected!==actual)return fail('ADM-403','管理員金鑰無效',403);
 return reply({ok:true,lines:['管理員金鑰驗證成功。','目前未開放跨帳號管理命令；FHI 命令仍僅限目前帳號。']});
}
if(command==='/check File-Hash-ID-List'){
 const rows=await sql`SELECT d.file_id,d.name,d.revision FROM bv_cloud_documents d WHERE d.owner_id=${user} AND NOT EXISTS(SELECT 1 FROM bv_console_hidden_fhi h WHERE h.owner_id=${user} AND h.file_id=d.file_id) ORDER BY d.updated_at DESC LIMIT 500`;
 return reply({ok:true,lines:rows.length?rows.map(x=>`${x.file_id} | ${x.name} | revision ${x.revision}`):['目前沒有可顯示的 File-Hash-ID 紀錄。']});
}
const m=command.match(/^\/delete\s+(ALL|ID|PART)\.FHI:<([^<>]+)>(?:<((?:\d+)|(?:\[\s*\d+(?:\s*,\s*\d+)*\s*\]))>)?$/i);
if(!m)return fail('CMD-400','未知或格式錯誤的命令；輸入 /help 查看用法');
const kind=m[1].toUpperCase(),file=m[2],part=m[3];if(!uuid(file))return fail('FHI-400','File-Hash-ID 必須是有效的 UUID');
if((kind==='PART'&&!part)||(kind!=='PART'&&part))return fail('FHI-400','提交序列格式錯誤');
const owned=await sql`SELECT file_id FROM bv_cloud_documents WHERE file_id=${file} AND owner_id=${user}`;
if(!owned.length)return fail('FHI-404','File-Hash-ID 不存在或無存取權限',404);
if(kind==='ID'){
 await sql`INSERT INTO bv_console_hidden_fhi(owner_id,file_id) VALUES(${user},${file}) ON CONFLICT(owner_id,file_id) DO NOTHING`;
 return reply({ok:true,lines:[`已從目前帳號的 FHI 清單移除 ${file}`,'文件、所有權、存取權限與提交紀錄均保留。']});
}
if(data.confirm!==file)return fail('FHI-428','永久刪除前必須確認 File-Hash-ID',428);
if(kind==='ALL'){
 const result=await sql`DELETE FROM bv_cloud_documents WHERE file_id=${file} AND owner_id=${user} RETURNING file_id`;
 return result.length?reply({ok:true,lines:[`已永久刪除 ${file} 的文件主紀錄及其連帶刪除的提交與分片。`]}):fail('FHI-404','文件不存在或無權限',404);
}
const versions=part.startsWith('[')?part.slice(1,-1).split(',').map(x=>Number(x.trim())):[Number(part)];
if(versions.some(x=>!Number.isSafeInteger(x)||x<1)||new Set(versions).size!==versions.length||versions.length>50)return fail('FHI-400','提交序列必須是正整數、不重複且最多 50 筆');
// Single SQL statement: validate all requested revisions, refuse last-version deletion,
// remove requested versions, then update document revision atomically.
const rows=await sql`WITH available AS (
 SELECT revision FROM bv_cloud_uploads WHERE file_id=${file} AND owner_id=${user} AND state='complete'
 UNION ALL SELECT revision FROM bv_delta_revisions WHERE file_id=${file} AND owner_id=${user}
), guard AS (
 SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE revision=ANY(${versions}::int[]))::int AS matched FROM available
), removed_uploads AS (
 DELETE FROM bv_cloud_uploads WHERE file_id=${file} AND owner_id=${user} AND state='complete' AND revision=ANY(${versions}::int[])
 AND (SELECT matched FROM guard)=${versions.length} AND (SELECT total FROM guard)>${versions.length} RETURNING revision
), removed_delta AS (
 DELETE FROM bv_delta_revisions WHERE file_id=${file} AND owner_id=${user} AND revision=ANY(${versions}::int[])
 AND (SELECT matched FROM guard)=${versions.length} AND (SELECT total FROM guard)>${versions.length} RETURNING revision
), updated AS (
 UPDATE bv_cloud_documents SET revision=(SELECT MAX(revision) FROM available WHERE revision<>ALL(${versions}::int[])),updated_at=NOW()
 WHERE file_id=${file} AND owner_id=${user} AND (SELECT matched FROM guard)=${versions.length} AND (SELECT total FROM guard)>${versions.length}
 RETURNING revision
) SELECT (SELECT total FROM guard) AS total,(SELECT matched FROM guard) AS matched,(SELECT COUNT(*) FROM removed_uploads)+(SELECT COUNT(*) FROM removed_delta) AS deleted,(SELECT revision FROM updated) AS revision`;
const r=rows[0];if(Number(r.matched)!==versions.length)return fail('FHI-404','指定的某些提交序列不存在；未刪除任何版本',404);
if(Number(r.total)<=versions.length)return fail('FHI-409','至少必須保留一個有效提交版本；未刪除任何版本',409);
return reply({ok:true,lines:[`已刪除 ${versions.length} 個提交版本：${versions.join(', ')}`,`目前最新版本：${r.revision}`]});
}catch(e){console.error('Console API error',e);return fail('CMD-500','伺服器處理失敗，請查看 Worker 日誌',500)}
}
