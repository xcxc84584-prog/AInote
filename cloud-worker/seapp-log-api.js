/* AREA A-SEAPP-SERVER START: Authenticated failure log ingestion and query */
// BLOCK B-SEAPP-SERVER-01 START:
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const clip=(x,n=180)=>String(x??'').replace(/[\r\n\t]/g,' ').slice(0,n);
const digest=async token=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');
async function sessionUser(req,sql){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const hash=await digest(token);const rows=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`;return rows[0]?.user_id??null}
// BLOCK B-SEAPP-SERVER-01 END.
// BLOCK B-SEAPP-SERVER-02 START:
export async function reportSeappArea(sql,evt){if(evt.success!==0)return;await sql`INSERT INTO bv_seapp_logs(trace_id,user_id,behavior_id,condition_id,step_id,area_id,previous_area,next_area,success,error_id,message,file_path,function_name,suggestion)
VALUES(${clip(evt.trace_id||crypto.randomUUID(),64)},${evt.user_id||null},${clip(evt.behavior_id,64)},${clip(evt.condition_id,64)},${clip(evt.step_id,64)},${clip(evt.area_id,64)},${clip(evt.previous_area,64)},${clip(evt.next_area,64)},0,${clip(evt.error_id,64)},${clip(evt.message,180)},${clip(evt.file_path,200)},${clip(evt.function_name,100)},${clip(evt.suggestion,200)})`}
// BLOCK B-SEAPP-SERVER-02 END.
// BLOCK B-SEAPP-SERVER-03 START:
export async function seappLogApi(req,env,path,sql){if(path!=='/api/seapp/logs')return null;if(!['GET','POST'].includes(req.method))return json({error:'Method not allowed'},405);
const user=await sessionUser(req,sql);if(!user)return json({error:'Unauthorized'},401);
if(req.method==='POST'){if(Number(req.headers.get('Content-Length')||0)>4096)return json({error:'Too large'},413);let evt;try{evt=await req.json()}catch{return json({error:'Bad JSON'},400)};if(!evt||typeof evt!=='object'||evt.success!==0||typeof evt.area_id!=='string'||!evt.area_id)return json({error:'Invalid log'},400);
await reportSeappArea(sql,{...evt,user_id:user});return json({ok:true},201)}
const url=new URL(req.url);const q=clip(url.searchParams.get('q'),100);const limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit'))||50));const like='%'+q+'%';const rows=await sql`SELECT id,created_at,trace_id,behavior_id,condition_id,step_id,area_id,previous_area,next_area,success,error_id,message,file_path,function_name,suggestion FROM bv_seapp_logs WHERE user_id=${user} AND (${q}='' OR trace_id ILIKE ${like} OR area_id ILIKE ${like} OR behavior_id ILIKE ${like} OR condition_id ILIKE ${like}) ORDER BY created_at DESC LIMIT ${limit}`;return json({ok:true,rows})}
// BLOCK B-SEAPP-SERVER-03 END.
/* AREA A-SEAPP-SERVER END. */
