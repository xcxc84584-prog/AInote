//BLOCK B-SEAPP-01 START:
// Server-owned log recorder. Do not store raw request payloads, keys, passwords or tokens.
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const clean=(s,n=180)=>String(s??'').replace(/[\r\n\t]/g,' ').slice(0,n);
export async function reportSeappArea(sql,e={}){
 if(e.success!==0)return; // only failures persisted
 await sql`INSERT INTO bv_seapp_logs(trace_id,user_id,behavior_id,condition_id,step_id,area_id,previous_area,next_area,success,error_id,message,file_path,function_name,suggestion)
 VALUES(${clean(e.trace_id||crypto.randomUUID(),64)},${e.user_id||null},${clean(e.behavior,64)},${clean(e.condition,64)},${clean(e.step,64)},${clean(e.area,64)},${clean(e.previous_area,64)},${clean(e.next_area,64)},0,${clean(e.error_id,64)},${clean(e.message,180)},${clean(e.file,240)},${clean(e.function_name,120)},${clean(e.suggestion,240)})`;
}
//BLOCK B-SEAPP-01 END.
//BLOCK B-SEAPP-02 START:
export async function seappLogApi(req,env,path,sql){
 if(path!=='/api/seapp/logs')return null;
 if(req.method!=='GET')return response({error:'Method not allowed'},405);
 const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];
 if(!token)return response({error:'Authentication required'},401);
 const hash=await digest(token);
 const users=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`;
 if(!users.length)return response({error:'Session expired'},401);
 const user=users[0].user_id;
 const url=new URL(req.url),q=clean(url.searchParams.get('q'),100),limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit'))||50));
 const rows=await sql`SELECT id,created_at,trace_id,behavior_id,condition_id,step_id,area_id,previous_area,next_area,success,error_id,message,file_path,function_name,suggestion FROM bv_seapp_logs
 WHERE user_id=${user} AND (${q}='' OR trace_id ILIKE ${'%'+q+'%'} OR area_id ILIKE ${'%'+q+'%'} OR behavior_id ILIKE ${'%'+q+'%'} OR condition_id ILIKE ${'%'+q+'%'})
 ORDER BY created_at DESC LIMIT ${limit}`;
 return response({ok:true,rows});
}
//BLOCK B-SEAPP-02 END.
