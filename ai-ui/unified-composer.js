// BV-Note v3.9.10 unified composer: existing textarea, SEND, attachment picker and chat storage.
import {validateImage,imageDataURL} from '../ai-multimodal/image-handler.js';
import {parseDocument} from '../ai-multimodal/document-parser.js';
import {consumeAIStream} from '../ai-stream/sse.js';
const host=document.getElementById('ai-composer-body');
let bar=null,fill=null,label=null,stop=null,active=null;
if(host){
 const wrap=document.createElement('div');wrap.id='ai-unified-progress';wrap.hidden=true;wrap.setAttribute('role','status');wrap.setAttribute('aria-live','polite');wrap.style.cssText='margin:9px 0;font:12px system-ui;color:#dbe7f7';
 label=document.createElement('div');label.textContent='準備中';
 bar=document.createElement('progress');bar.max=100;bar.value=0;bar.style.cssText='width:100%;height:12px;accent-color:#4b93d5';
 stop=document.createElement('button');stop.type='button';stop.textContent='停止生成';stop.style.cssText='margin-top:5px;padding:4px 10px';stop.hidden=true;stop.onclick=()=>active?.abort();
 wrap.append(label,bar,stop);host.append(wrap);fill=wrap;
}
function progress(p,text,indeterminate=false){if(!fill)return;fill.hidden=false;label.textContent=text;bar.value=indeterminate?0:Math.max(0,Math.min(100,p));if(indeterminate)bar.removeAttribute('value');else bar.value=p;stop.hidden=!active;}
function hide(){if(fill)fill.hidden=true;active=null;}
async function prepare(files,signal){let image=null,docTexts=[],n=files.length;for(let i=0;i<n;i++){
 if(signal.aborted)throw new DOMException('Stopped','AbortError');const f=files[i];progress(Math.round(5+30*i/Math.max(1,n)),`讀取附件 ${i+1}/${n}：${f.name}`);
 if(f.type.startsWith('image/')){if(image)throw Error('網站模式目前最多支援一張圖片');await validateImage(f);image=await imageDataURL(f);}
 else{const d=await parseDocument(f,{signal});const excerpt=d.text.slice(0,9000);docTexts.push(`\n[LOCAL DOCUMENT EXCERPT: ${f.name}; ${excerpt.length}/${d.text.length} characters]\n${excerpt}`);}
 progress(Math.round(5+30*(i+1)/Math.max(1,n)),`已處理附件 ${i+1}/${n}`);
 }return {image,docTexts};}
window.BVUnifiedAI={async send({source,files,history,token,model,onDelta}){
 if(active)throw Error('已有進行中的請求');active=new AbortController();const signal=active.signal;stop.hidden=false;let trace='unknown';
 try{progress(2,'準備附件與對話上下文');const {image,docTexts}=await prepare(files,signal);const messages=history.slice(-25).map(m=>({role:m.role,text:m.text}));
 let prompt=(source||'請分析附件')+docTexts.join('\n');if(prompt.length>28000)throw Error('AI-U-413：本次文件摘要超過輸入限制，請縮小附件');messages.push({role:'user',text:prompt});
 const base=String(window.BV_CLOUD_API_URL||'').replace(/\/+$/,'');if(!base)throw Error('AI-U-503：未設定網站 API URL');
 progress(40,'正在上傳請求資料（瀏覽器 Fetch 無法提供精確上傳百分比）',true);
 const response=await fetch(base+'/api/ai/v2/responses',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({model:['gpt-5','gpt-4.1','gpt-4.1-mini'].includes(model)?model:'gpt-5',messages,images:image?[image]:[],stream:true,max_output_tokens:2048}),signal});
 trace=response.headers.get('X-BV-Trace-ID')||'unknown';if(!response.ok){const d=await response.json().catch(()=>({}));throw Error(`${d.error_id||'AI-U-HTTP'} HTTP ${response.status} trace=${d.trace_id||trace} ${d.error||''}`)}
 progress(70,'已連線，正在接收 AI 回覆…',true);let received=0;const state=await consumeAIStream(response,{signal,onDelta:d=>{received+=d.length;onDelta(d);progress(70,`正在接收 AI 回覆（已收到 ${received} 字元）`,true)}});
 if(state.status!=='completed')throw Error(`AI-U-STREAM-${state.status} trace=${trace}: ${state.error||'未完成'}`);
 progress(100,'完成：AI 回覆已接收');return {text:state.text,trace};
 }catch(e){progress(0,`失敗：${String(e.message||e).slice(0,180)}`);throw e;}finally{active=null;if(stop)stop.hidden=true;}
 },reset:hide};
