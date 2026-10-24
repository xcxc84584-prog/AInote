// S6/S7 opt-in UI: isolated from legacy AI Chat, site-key mode only.
import {buildAIRequest} from '../ai-core/request-builder.js';
import {consumeAIStream} from '../ai-stream/sse.js';
const composer=document.getElementById('ai-chat-composer');
const input=document.getElementById('ai-message-input');
if(composer&&input){
 const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;padding:6px;align-items:center';
 const send=document.createElement('button');send.type='button';send.textContent='S6/S7 Beta · GPT-5';send.title='Experimental site-key streaming. Legacy SEND remains unchanged.';
 const stop=document.createElement('button');stop.type='button';stop.textContent='Stop Beta';stop.disabled=true;
 const output=document.createElement('pre');output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:40vh;overflow:auto;padding:8px';output.setAttribute('aria-live','polite');
 row.append(send,stop);composer.append(row,output);let controller=null;
 send.addEventListener('click',async()=>{
  if(controller)return;const token=localStorage.getItem('bvnote-auth-session-v1');if(!token){output.textContent='AI-S6-401: Sign in first';return;}
  const text=input.value.trim();if(!text)return;
  let request;try{request=buildAIRequest({model:'gpt-5',messages:[{role:'user',text}],stream:true});}catch(e){output.textContent=e.message;return;}
  controller=new AbortController();stop.disabled=false;send.disabled=true;output.textContent='Generating…';
  try{const base=String(window.BV_CLOUD_API_URL||'').replace(/\/+$/,'');
   const response=await fetch(base+'/api/ai/v2/responses',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({model:request.model,messages:[{role:'user',text}],stream:true,max_output_tokens:request.max_output_tokens}),signal:controller.signal});
   if(!response.ok){let e={};try{e=await response.json()}catch{}throw Error(`${e.error_id||'AI-S7-HTTP'} ${e.error||response.status} trace=${e.trace_id||'none'}`)}
   output.textContent='';const state=await consumeAIStream(response,{signal:controller.signal,onDelta:(d)=>{output.textContent+=d},onState:s=>{if(s.status==='failed'||s.status==='stopped')output.textContent+='\n['+s.status+': '+(s.error||'')+']';}});
   if(state.status==='completed')output.textContent+='\n[completed]';
  }catch(e){output.textContent+='\n[AI-S7-ERROR] '+e.message;}finally{controller=null;send.disabled=false;stop.disabled=true;}
 });
 stop.addEventListener('click',()=>controller?.abort());
}
