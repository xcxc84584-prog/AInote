// BV-Note v3.9.4: application-observed network counters; not Neon billing egress.
const measuredPath=p=>/^\/api\/(?:v378\/|files(?:\/|$)|delta(?:\/|$)|v3(?:\/|$))/.test(p);
export async function meteredFetch(req,env,ctx,handler){
 const response=await handler();
 const path=new URL(req.url).pathname;
 if(!env.DATABASE_URL||!measuredPath(path)||response.status<200||response.status>=300)return response;
 const method=req.method.toUpperCase();
 // Avoid request-body consumption; upload counts use Content-Length when present.
 const declared=Number(req.headers.get('content-length'));
 const upload=(method==='PUT'||method==='POST'||method==='PATCH')&&Number.isSafeInteger(declared)&&declared>0?declared:0;
 const isFileDownload=method==='GET'&&(/\/parts\/\d+$/i.test(path)||/^\/api\/files\/[0-9a-f-]+$/i.test(path)||/\/download(?:\/|$)/i.test(path));
 // Clone does not consume the response sent to the client; response sizes may still be memory intensive.
 ctx.waitUntil((async()=>{
  try{
   let responseBytes=0;
   const length=Number(response.headers.get('content-length'));
   if(Number.isSafeInteger(length)&&length>=0)responseBytes=length;
   else responseBytes=(await response.clone().arrayBuffer()).byteLength;
   const sql=(await import('@neondatabase/serverless')).neon(env.DATABASE_URL);
   const download=isFileDownload?responseBytes:0;
   // Egress is the observed Worker->client response proxy, NOT the Neon->Worker network bill.
   await sql`INSERT INTO bv_database_flow_daily(day,upload_bytes,download_bytes,egress_proxy_bytes,request_count)
   VALUES((NOW() AT TIME ZONE 'UTC')::date,${upload},${download},${responseBytes},1)
   ON CONFLICT(day) DO UPDATE SET upload_bytes=bv_database_flow_daily.upload_bytes+EXCLUDED.upload_bytes,
   download_bytes=bv_database_flow_daily.download_bytes+EXCLUDED.download_bytes,
   egress_proxy_bytes=bv_database_flow_daily.egress_proxy_bytes+EXCLUDED.egress_proxy_bytes,
   request_count=bv_database_flow_daily.request_count+1`;
  }catch(e){console.warn('BV database-flow counter unavailable',String(e).slice(0,150))}
 })());
 return response;
}
