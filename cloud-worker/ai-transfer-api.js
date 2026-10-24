// S5: opt-in verified ingest endpoint. Validates actual bytes and SHA256, then discards body.
// No R2 or Neon blob storage. This is NOT an AI file-processing endpoint.
import {report_webserver_powershell_log} from './console-log.js';
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export async function aiTransferApi(req,env,path,sql){
 if(path!=='/api/ai/verified-part')return null;
 const trace=crypto.randomUUID();
 const fail=(code,message,status=400)=>json({ok:false,error_id:code,error:message,trace_id:trace},status);
 if(req.method!=='PUT')return fail('AI-TR-405','PUT required',405);
 const uploadId=req.headers.get('X-BV-Upload-ID'),index=Number(req.headers.get('X-BV-Part-Index')),count=Number(req.headers.get('X-BV-Part-Count')),claimedHash=req.headers.get('X-BV-SHA256');
 if(!uuid(uploadId)||!Number.isInteger(index)||!Number.isInteger(count)||count<1||count>200||index<0||index>=count||!/^[0-9a-f]{64}$/i.test(claimedHash||''))return fail('AI-TR-400','Invalid upload headers');
 const auth=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!auth)return fail('AI-TR-401','Login required',401);
 const tokenHash=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(auth)));
 const owners=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${tokenHash} AND expires_at>NOW() LIMIT 1`;if(!owners.length)return fail('AI-TR-401','Invalid session',401);
 const size=Number(req.headers.get('Content-Length'));if(Number.isFinite(size)&&size>5*1024*1024)return fail('AI-TR-413','Part exceeds 5 MiB',413);
 let buffer;try{buffer=await req.arrayBuffer();}catch{return fail('AI-TR-400','Cannot read part');}
 if(buffer.byteLength<1||buffer.byteLength>5*1024*1024)return fail('AI-TR-413','Part must be 1..5 MiB',413);
 const actual=hex(await crypto.subtle.digest('SHA-256',buffer));if(actual!==claimedHash.toLowerCase())return fail('AI-TR-422','SHA256 mismatch',422);
 // Atomic, idempotent quota function. Requires migrate_ai_verified_parts.sql.
 try{
 const rows=await sql`SELECT * FROM bv_claim_ai_verified_part(${owners[0].user_id}::uuid,${uploadId}::uuid,${index}::integer,${count}::integer,${buffer.byteLength}::integer,${actual}::text)`;
 const result=rows[0];
 if(result?.status==='limit')return fail('AI-LIMIT-001','Daily website quota exhausted',429);
 if(result?.status==='conflict')return fail('AI-TR-409','Conflicting retry metadata',409);
 if(result?.status!=='charged'&&result?.status!=='duplicate')return fail('AI-TR-500','Unexpected claim status',500);
 // Best effort, never log uploaded content or credentials.
 try{await report_webserver_powershell_log(sql,{source:'ai-transfer',level:'info',event_code:'AI_TRANSFER',message:JSON.stringify({target:'ai-verified-part',trace_id:trace,status:result.status,bytes:buffer.byteLength,index})});}catch{}
 return json({ok:true,trace_id:trace,status:result.status,charged:result.status==='charged'?1:0,stored:false,analyzed:false,part_index:index});
 }catch(e){console.error('AI-TR-500',trace,e?.name);return fail('AI-TR-500','Verified part registration failed; inspect Worker logs',500);}
}
