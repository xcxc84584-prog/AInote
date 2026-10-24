import {meteredFetch} from './database-flow.js';
import {consoleApi} from './console-api.js';
import {seappLogApi,reportSeappArea} from './seapp-log-api.js';
import {report_webserver_powershell_log} from './console-log.js';
import {authApi} from './auth.js';
import {chunkApi} from './chunk-api.js';
import {deltaApi} from './delta-api.js';
// AREA A11 START: CloudAPI | File: cloud-worker/worker.js
import JSZip from 'jszip';
import { neon } from '@neondatabase/serverless';
const reply=(data,status=200,origin='')=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}});
// Apply CORS consistently to authentication responses, including 4xx/5xx.
function withCors(response, origin) {
  const headers = new Headers(response.headers);
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Expose-Headers','X-BV-SHA256, X-BV-Console-Admin');
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
const lifeDays=v=>Number.isInteger(v)&&[1,7,14,30,90].includes(v);
const hex=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export default {async scheduled(event,env,ctx){ctx.waitUntil((async()=>{if(!env.DATABASE_URL)throw Error('DATABASE_URL missing');const sql=neon(env.DATABASE_URL);await sql`DELETE FROM cloud_files WHERE expires_at IS NOT NULL AND expires_at<=NOW()`;
if(env.AI_UPLOADS){const listed=await env.AI_UPLOADS.list({prefix:'ai-temp/',limit:1000});const expired=listed.objects.filter(o=>o.uploaded&&Date.now()-new Date(o.uploaded).getTime()>24*3600*1000).map(o=>o.key);if(expired.length)await env.AI_UPLOADS.delete(expired)}
await sql`DELETE FROM bv_console_guests WHERE last_seen < NOW()-INTERVAL '24 hours'`;await sql`DELETE FROM bv_console_ip_history WHERE seen_at < NOW()-INTERVAL '30 days'`;await sql`DELETE FROM bv_guest_request_seconds WHERE second_at < NOW()-INTERVAL '2 days'`;await sql`DELETE FROM bv_ai_chunks WHERE created_at<NOW()-INTERVAL '24 hours'`;await sql`DELETE FROM bv_cloud_uploads WHERE state='uploading' AND created_at<NOW()-INTERVAL '48 hours'`})())},async fetch(req,env,ctx){return meteredFetch(req,env,ctx,()=>this.handleFetch(req,env,ctx));},async handleFetch(req,env,ctx){const origin=req.headers.get('Origin')||'',allowed=env.ALLOWED_ORIGIN||'';if(origin&&origin!==allowed)return reply({error:'Origin 不允許'},403);const cors=origin===allowed?origin:'';if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...(cors?{'Access-Control-Allow-Origin':cors}:{}),'Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-BV-Guest-ID, X-BV-Upload-ID, X-BV-Part-Index, X-BV-Part-Count, X-BV-SHA256, X-BV-Console-Admin','Access-Control-Max-Age':'3600','Vary':'Origin'}});
try{if(!env.DATABASE_URL)return reply({error:'未設定 DATABASE_URL'},503,cors);const sql=neon(env.DATABASE_URL);const path=new URL(req.url).pathname;
// Best-effort identity/IP accounting. Guest token is a non-authorizing pseudonym.
if(path.startsWith('/api/')&&req.method!=='OPTIONS')ctx.waitUntil((async()=>{try{
 const ip=(req.headers.get('CF-Connecting-IP')||'').slice(0,45);
 const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];
 let identity=null,guestNumber=null;
 if(token){const hash=await hex(token);const rows=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`;if(rows.length)identity='Account-'+rows[0].user_id;}
 if(!identity){const guest=req.headers.get('X-BV-Guest-ID')||'';
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(guest))return;
 // Database sequence IDs are recycled only after expiry; guest tokens never authorize access.
 const rows=await sql`WITH active AS (UPDATE bv_console_guests SET last_seen=NOW() WHERE guest_token=${guest} RETURNING guest_number), available AS (SELECT n FROM generate_series(1,100000) n WHERE NOT EXISTS(SELECT 1 FROM bv_console_guests g WHERE g.guest_number=n) ORDER BY n LIMIT 1) INSERT INTO bv_console_guests(guest_number,guest_token,last_seen) SELECT n,${guest},NOW() FROM available WHERE NOT EXISTS(SELECT 1 FROM active) ON CONFLICT DO NOTHING RETURNING guest_number`;
 if(rows.length)guestNumber=rows[0].guest_number;else {const existing=await sql`SELECT guest_number FROM bv_console_guests WHERE guest_token=${guest}`;guestNumber=existing[0]?.guest_number;}
 if(!guestNumber)return;identity='Guest-'+guestNumber;
 await sql`INSERT INTO bv_guest_request_seconds(guest_number,second_at,request_count) VALUES(${guestNumber},date_trunc('second',NOW()),1) ON CONFLICT(guest_number,second_at) DO UPDATE SET request_count=bv_guest_request_seconds.request_count+1`;
 }
 if(ip&&identity)await sql`INSERT INTO bv_console_ip_history(identity,ip,seen_at) VALUES(${identity},${ip},NOW())`;
 }catch(e){console.error('Console identity metrics:',e)}})());
// Best-effort authenticated per-second request counter; no request bodies or tokens stored.
if(path.startsWith('/api/') && req.method!=='OPTIONS')ctx.waitUntil((async()=>{try{const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return;const hash=await hex(token);await sql`INSERT INTO bv_account_request_seconds(user_id,second_at,request_count) SELECT user_id,date_trunc('second',NOW()),1 FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() ON CONFLICT(user_id,second_at) DO UPDATE SET request_count=bv_account_request_seconds.request_count+1`}catch(e){console.error('Account request metric failed',e)}})());
const seappResponse=await seappLogApi(req,env,path,sql);if(seappResponse)return withCors(seappResponse,cors);
const consoleResponse=await consoleApi(req,env,path,sql);if(consoleResponse)return withCors(consoleResponse,cors);const deltaResponse=await deltaApi(req,env,path,sql);if(deltaResponse)return withCors(deltaResponse,cors);const chunkResponse=await chunkApi(req,env,path,sql);if(chunkResponse)return withCors(chunkResponse,cors);const authResponse=await authApi(req,env,path);if(authResponse){return withCors(authResponse,cors);}
let match;
if(path==='/api/projects'&&req.method==='POST'){const b=await req.json();if(typeof b.name!=='string'||!b.name.trim()||b.name.length>150)throw Error('專案名稱無效');const id=crypto.randomUUID();await sql`INSERT INTO projects(id,name) VALUES(${id},${b.name.trim()})`;return reply({project_id:id},201,cors)}
if(path==='/api/health'&&req.method==='GET')return reply({ok:true},200,cors);
if((match=path.match(/^\/api\/files\/([^/]+)\/meta$/))&&req.method==='GET'){const id=match[1];if(!uuid(id))return reply({error:'File Hash ID 格式無效'},400,cors);const rows=await sql`SELECT file_id,project_id,name,revision,last_commit,life_days,expires_at FROM cloud_files WHERE file_id=${id} AND (expires_at IS NULL OR expires_at>NOW())`;return rows.length?reply(rows[0],200,cors):reply({error:'找不到 File Hash ID'},404,cors)}
if(path==='/api/files'&&req.method==='POST'){const b=await req.json();if(!uuid(b.file_id)||!uuid(b.project_id))throw Error('無效的文件或專案 ID');if(typeof b.name!=='string'||!b.name.trim()||b.name.length>240)throw Error('文件名稱無效');if(typeof b.content!=='string'||new TextEncoder().encode(b.content).length>1024*1024)throw Error('單檔上限為 1 MiB');if(!lifeDays(b.life_days))throw Error('請設定 1/7/14/30/90 天保存期限');const digest=await hex(b.content);const expire=new Date(Date.now()+b.life_days*86400000).toISOString();await sql`INSERT INTO cloud_files(file_id,project_id,name,revision,last_commit,life_days,expires_at) VALUES(${b.file_id},${b.project_id},${b.name},1,NOW(),${b.life_days},${expire})`;await sql`INSERT INTO commits(file_id,revision,mode,content,sha256) VALUES(${b.file_id},1,'initial',${b.content},${digest})`;return reply({file_id:b.file_id,revision:1,life_days:b.life_days,expires_at:expire},201,cors)}
if((match=path.match(/^\/api\/files\/([^/]+)\/history$/))&&req.method==='GET'){const id=match[1];if(!uuid(id))throw Error('ID 無效');const f=await sql`SELECT name FROM cloud_files WHERE file_id=${id} AND (expires_at IS NULL OR expires_at>NOW())`;if(!f.length)return reply({error:'找不到文件'},404,cors);const commits=await sql`SELECT revision,mode,sha256,created_at FROM commits WHERE file_id=${id} ORDER BY revision DESC LIMIT 100`;return reply({name:f[0].name,commits},200,cors)}
if((match=path.match(/^\/api\/files\/([^/]+)\/history\/(\d+)$/))&&req.method==='DELETE'){const id=match[1],rev=Number(match[2]);if(!uuid(id)||!Number.isSafeInteger(rev)||rev<1)return reply({error:'ID 或版本號無效'},400,cors);const rows=await sql`WITH existing AS (SELECT revision FROM commits WHERE file_id=${id}), guard AS (SELECT COUNT(*)::int AS count FROM existing), deleted AS (DELETE FROM commits WHERE file_id=${id} AND revision=${rev} AND (SELECT count FROM guard)>1 RETURNING revision), updated AS (UPDATE cloud_files SET revision=(SELECT MAX(revision) FROM commits WHERE file_id=${id} AND revision<>${rev}),last_commit=NOW() WHERE file_id=${id} AND EXISTS(SELECT 1 FROM deleted) RETURNING revision) SELECT (SELECT count FROM guard) AS total,(SELECT COUNT(*)::int FROM deleted) AS removed,(SELECT revision FROM updated) AS revision`;const r=rows[0];if(!r?.total)return reply({error:'找不到文件或提交紀錄'},404,cors);if(r.total<=1)return reply({error:'最後一筆提交不可單獨刪除，請刪除整個雲端專案'},409,cors);if(!r.removed)return reply({error:'找不到該版本'},404,cors);return reply({deleted:true,revision:r.revision},200,cors)}
if((match=path.match(/^\/api\/files\/([^/]+)\/commit$/))&&req.method==='POST'){const id=match[1];if(!uuid(id))throw Error('ID 無效');const b=await req.json();if(!['full','incremental'].includes(b.mode)||!Number.isInteger(b.base_revision)||(b.mode==='full'&&typeof b.content!=='string'))throw Error('Commit 資料無效');let content=b.content;
if(b.mode==='incremental'){
if(!b.changes||typeof b.changes!=='object'||Array.isArray(b.changes)||!Array.isArray(b.deleted))throw Error('增量資料無效');
const prev=await sql`SELECT content FROM commits WHERE file_id=${id} AND revision=${b.base_revision}`;
if(!prev.length)return reply({error:'找不到基礎版本'},409,cors);
const zip=await JSZip.loadAsync(Uint8Array.from(atob(prev[0].content),c=>c.charCodeAt(0)));
const safe=p=>typeof p==='string'&&p.length>0&&p.length<512&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(x=>x==='..'||x==='.'||!x);
for(const p of b.deleted){if(!safe(p))throw Error('刪除路徑不合法');zip.remove(p)}
for(const [p,value] of Object.entries(b.changes)){if(!safe(p)||typeof value!=='string')throw Error('修改檔案資料不合法');zip.file(p,Uint8Array.from(atob(value),c=>c.charCodeAt(0)),{date:new Date('2000-01-01T00:00:00Z')})}
const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));content=btoa(binary);
}
if(typeof content!=='string'||new TextEncoder().encode(content).length>1024*1024)throw Error('重建 ZIP 超過 1 MiB 上限');const digest=await hex(content);const name=String(b.name||'').slice(0,240);const current=await sql`SELECT revision,life_days,expires_at FROM cloud_files WHERE file_id=${id} AND (expires_at IS NULL OR expires_at>NOW())`;if(!current.length)return reply({error:'找不到文件'},404,cors);if(b.mode==='full'&&!lifeDays(b.life_days))throw Error('完整提交必須選擇保存期限');if(current[0].revision!==b.base_revision)return reply({error:'雲端版本已改變，請重新整理後比較'},409,cors);const old=await sql`SELECT sha256 FROM commits WHERE file_id=${id} AND revision=${b.base_revision}`;if(old[0]?.sha256===digest)return reply({unchanged:true,revision:b.base_revision,life_days:current[0].life_days,expires_at:current[0].expires_at},200,cors);const days=b.mode==='full'?b.life_days:current[0].life_days;const expiry=b.mode==='full'?new Date(Date.now()+days*86400000).toISOString():current[0].expires_at;const changed=await sql`UPDATE cloud_files SET revision=revision+1,name=${name},last_commit=NOW(),life_days=${days},expires_at=${expiry} WHERE file_id=${id} AND revision=${b.base_revision} RETURNING revision`;if(!changed.length)return reply({error:'版本衝突'},409,cors);await sql`INSERT INTO commits(file_id,revision,mode,content,sha256) VALUES(${id},${changed[0].revision},${b.mode},${content},${digest})`;return reply({revision:changed[0].revision,life_days:days,expires_at:expiry},200,cors)}
if((match=path.match(/^\/api\/files\/([^/]+)$/))&&req.method==='DELETE'){const id=match[1];if(!uuid(id))return reply({error:'ID 無效'},400,cors);const rows=await sql`DELETE FROM cloud_files WHERE file_id=${id} RETURNING file_id`;return rows.length?reply({deleted:true,file_id:id},200,cors):reply({error:'找不到文件'},404,cors)}
if((match=path.match(/^\/api\/files\/([^/]+)$/))&&req.method==='GET'){const id=match[1];if(!uuid(id))throw Error('ID 無效');const q=new URL(req.url).searchParams.get('revision');const f=await sql`SELECT name,revision FROM cloud_files WHERE file_id=${id} AND (expires_at IS NULL OR expires_at>NOW())`;if(!f.length)return reply({error:'找不到文件'},404,cors);const rev=q?Number(q):f[0].revision;if(!Number.isInteger(rev)||rev<1)throw Error('版本號無效');const rows=await sql`SELECT content,sha256,created_at FROM commits WHERE file_id=${id} AND revision=${rev}`;if(!rows.length)return reply({error:'找不到版本'},404,cors);return reply({file_id:id,name:f[0].name,revision:rev,...rows[0]},200,cors)}
return reply({error:'找不到 API 路由'},404,cors);
}catch(e){console.error('Cloud API error',e);ctx.waitUntil(reportSeappArea(neon(env.DATABASE_URL),{area:'A11',behavior:'BH-CLOUD',condition:'C-ERROR',step:'S-ERROR',success:0,error_id:'SEAPP-A11-001',message:String(e.message||'Worker error').slice(0,180),file:'cloud-worker/worker.js',function_name:'fetch',trace_id:crypto.randomUUID()}).catch(()=>{}));return reply({error:e.message==='Unexpected end of JSON input'?'JSON 格式錯誤':String(e.message||'服務發生錯誤').slice(0,200)},400,cors)}}};
// AREA A11 END: CloudAPI
