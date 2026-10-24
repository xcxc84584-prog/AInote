// v3.9.11 Local RAG: local-only keyword index with source citations and hash dedup.
const DB='bvnote-rag-v3911',STORE='documents';
function openDB(){return new Promise((ok,bad)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
async function txn(mode,fn){const db=await openDB();return new Promise((ok,bad)=>{const t=db.transaction(STORE,mode),s=t.objectStore(STORE);fn(s,ok,bad);t.onerror=()=>bad(t.error);t.oncomplete=()=>db.close()})}
async function sha(text){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(h),v=>v.toString(16).padStart(2,'0')).join('')}
export function splitMarkdown(text,max=1200){const sections=text.split(/(?=^#{1,6}\s)/m);const chunks=[];let offset=0;for(const section of sections){for(let i=0;i<section.length;i+=max){const piece=section.slice(i,i+max);if(piece.trim())chunks.push({text:piece,start:offset+i,end:offset+i+piece.length})}offset+=section.length}return chunks}
export async function addDocument(name,text){if(typeof text!=='string'||text.length>2e6)throw Error('Document exceeds 2,000,000 characters');const id=await sha(name+'\0'+text);const record={id,name,hash:await sha(text),chunks:splitMarkdown(text),updated:Date.now()};await txn('readwrite',(s,ok)=>{s.put(record);ok(record)});return record}
export async function documents(){return txn('readonly',(s,ok,bad)=>{const r=s.getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
export async function removeDocument(id){return txn('readwrite',(s,ok)=>{s.delete(id);ok(true)})}
export async function clearDocuments(){return txn('readwrite',(s,ok)=>{s.clear();ok(true)})}
export async function search(query,k=5){const terms=query.toLowerCase().split(/\s+/).filter(Boolean).slice(0,20);const docs=await documents(),found=[];for(const d of docs)for(const c of d.chunks){const low=c.text.toLowerCase();const score=terms.reduce((n,t)=>n+(low.includes(t)?1:0),0);if(score)found.push({documentId:d.id,name:d.name,start:c.start,end:c.end,text:c.text,score})}return found.sort((a,b)=>b.score-a.score).slice(0,Math.min(20,Math.max(1,k)))}
export async function hybridSearch(query,k=5){return {mode:'keyword-fallback',results:await search(query,k),warning:'Semantic embedding not enabled; keyword-only fallback.'}}
