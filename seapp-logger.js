/* AREA A-SEAPP-LOG START: Browser error observation */
// BLOCK B-SEAPP-LOG-01 START:
(()=>{'use strict';const STORAGE='bvnote-seapp-error-v390';const LIMIT=100;const API=()=>String(window.BV_CLOUD_API_URL||'').replace(/\/+$/,'');let busy=false;
const clip=(v,n=200)=>String(v??'').slice(0,n);
function record(event){if(busy)return;busy=true;try{const item={trace_id:crypto.randomUUID(),created_at:new Date().toISOString(),behavior_id:'BH-UI',condition_id:'C-UI-ERROR',step_id:'S-UI-ERROR',area_id:clip(event.area||'A-UI-UNCAUGHT',64),previous_area:null,next_area:null,success:0,error_id:clip(event.error_id||'SEAPP-UI-001',64),message:clip(event.message,180),file_path:clip(event.file,200),function_name:clip(event.function_name,100),suggestion:'檢查該 AREA 對應 BLOCK 及瀏覽器錯誤堆疊'};
let list=[];try{list=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(!Array.isArray(list))list=[]}catch{}list.unshift(item);try{localStorage.setItem(STORAGE,JSON.stringify(list.slice(0,LIMIT)))}catch{}
const token=window.BVAuth?.getToken?.()||localStorage.getItem('bvnote-auth-session-v1');if(token&&API()){fetch(API()+'/api/seapp/logs',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(item)}).catch(()=>{})}}
finally{busy=false}}
window.BVSeappLog={record,list:()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'[]')}catch{return[]}}};
window.addEventListener('error',e=>record({message:e.message,file:e.filename,function_name:'window.error'}));
window.addEventListener('unhandledrejection',e=>record({message:e.reason?.message||'Unhandled promise rejection',function_name:'unhandledrejection'}));
})();
// BLOCK B-SEAPP-LOG-01 END.
/* AREA A-SEAPP-LOG END. */
