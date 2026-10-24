// S6/S7 opt-in server-side Responses API proxy. No attachment bytes or secrets logged.
import {report_webserver_powershell_log} from './console-log.js';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function aiS67Api(req,env,path,sql){if(path!=='/api/ai/v2/responses')return null;
 const trace=crypto.randomUUID(),target='ai-request-model';
 const report=async(level,code,detail)=>{try{await report_webserver_powershell_log(sql,{source:'ai-s67',level,event_code:code,message:JSON.stringify({kind:'real',target,trace_id:trace,detail:String(detail).slice(0,160)})})}catch(e){console.error('AI-S67-LOG',trace,e?.name)}};
 const fail=async(code,msg,status)=>{await report('error',code,msg);return json({ok:false,error_id:code,trace_id:trace,error:msg},status)};
 if(req.method!=='POST')return fail('AI-S67-405','POST only',405);
 if(!env.OPENAI_API_KEY)return fail('AI-S67-503','Site AI key not configured',503);
 const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return fail('AI-S67-401','Sign in required',401);
 const rows=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${await hash(token)} AND expires_at>NOW() LIMIT 1`;
 if(!rows.length)return fail('AI-S67-401','Session expired',401);
 const length=Number(req.headers.get('content-length')||0);if(length>7500000)return fail('AI-S67-413','Request too large',413);
 let body;try{const raw=await req.text();if(raw.length>7500000)throw Error('oversize');body=JSON.parse(raw)}catch{return fail('AI-S67-400','Invalid JSON',400)}
 const model=body?.model,stream=body?.stream===true,messages=body?.messages;const images=body?.images??[];if(!Array.isArray(images)||images.length>1)return fail("AI-S9-400","Maximum one image",400);for(const image of images){if(typeof image!=="string"||image.length>7200000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))return fail("AI-S9-415","Invalid image data URL",415)}
 if(!['gpt-5','gpt-4.1','gpt-4.1-mini'].includes(model)||!Array.isArray(messages)||messages.length<1||messages.length>30)return fail('AI-S67-400','Unsupported model or messages',400);
 let total=0;const input=[];for(const m of messages){if(!m||!['user','assistant'].includes(m.role)||typeof m.text!=='string'||!m.text.trim()||m.text.length>30000)return fail('AI-S67-400','Invalid message',400);total+=m.text.length;input.push({role:m.role,content:m.text})}
 if(images.length){const last=input[input.length-1];if(last.role!=="user")return fail("AI-S9-400","Image must belong to user message",400);last.content=[{type:"input_text",text:last.content},{type:"input_image",image_url:images[0]}]}if(total>60000)return fail('AI-S67-413','Context budget exceeded',413);
 const max=body.max_output_tokens??2048;if(!Number.isSafeInteger(max)||max<256||max>8192)return fail('AI-S67-400','Invalid output budget',400);
 // Site quota: reserve once before upstream. Retries are new calls; never count streamed chunks.
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const charged=await sql`INSERT INTO bv_ai_usage(user_id,usage_day,used) VALUES(${rows[0].user_id},${day}::date,1) ON CONFLICT(user_id,usage_day) DO UPDATE SET used=bv_ai_usage.used+1 WHERE bv_ai_usage.used<100 RETURNING used`;
 if(!charged.length)return fail('AI-S67-429','Daily AI quota reached',429);
 try{
  const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model,input,max_output_tokens:max,stream,store:false}),redirect:'manual'});
  if(!upstream.ok){await report('error','AI-S67-UPSTREAM','status='+upstream.status);return json({ok:false,error_id:'AI-S67-UPSTREAM',trace_id:trace,error:'Upstream error',upstream_status:upstream.status},502)}
  if(stream){await report('info','AI-S67-STREAM-START','stream accepted');return new Response(upstream.body,{status:200,headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','X-BV-Trace-ID':trace,'X-Accel-Buffering':'no'}})}
  const response=await upstream.json();await report('info','AI-S67-COMPLETE','nonstream success');return json({ok:true,trace_id:trace,response});
 }catch(e){return fail('AI-S67-502','Upstream unavailable',502)}
}
