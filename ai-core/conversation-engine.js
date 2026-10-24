// S8: Immutable conversation DAG. No writes to legacy localStorage.
export function validateThread(messages){
 if(!Array.isArray(messages)||messages.length>500)return false;
 const ids=new Set();for(const m of messages){if(!m||typeof m.id!=='string'||!m.id||ids.has(m.id)||!['user','assistant'].includes(m.role)||typeof m.text!=='string')return false;ids.add(m.id)}
 const byId=new Map(messages.map(m=>[m.id,m]));for(const m of messages){let p=m.parentId??null,seen=new Set([m.id]);while(p!==null){if(seen.has(p)||!byId.has(p))return false;seen.add(p);p=byId.get(p).parentId??null}}return true;
}
export function appendMessage(messages,{role,text,parentId=null}){
 if(!validateThread(messages)||!['user','assistant'].includes(role)||typeof text!=='string'||text.length>30000)throw Error('AI-S8-400 invalid message');
 if(parentId!==null&&!messages.some(m=>m.id===parentId))throw Error('AI-S8-404 missing parent');
 const next=[...messages,{id:crypto.randomUUID(),parentId,role,text,createdAt:new Date().toISOString()}];if(!validateThread(next))throw Error('AI-S8-409 invalid DAG');return next;
}
export function branchPath(messages,leafId){if(!validateThread(messages))throw Error('AI-S8-400 invalid DAG');const map=new Map(messages.map(m=>[m.id,m]));const result=[];let id=leafId;while(id!==null){const m=map.get(id);if(!m)throw Error('AI-S8-404 missing leaf');result.unshift(m);id=m.parentId??null}return result;}
export function reviseMessage(messages,id,text){const old=messages.find(m=>m.id===id);if(!old)throw Error('AI-S8-404 missing message');return appendMessage(messages,{role:old.role,text,parentId:old.parentId??null});}
export function exportThreadMD(messages,leafId){return branchPath(messages,leafId).map((m,i)=>`## ${i+1}. ${m.role==='user'?'Q':'A'}\n\n${m.text.replace(/\r\n/g,'\n')}`).join('\n\n---\n\n')+'\n';}
