// Dedicated import database: catalog is lightweight; messages loaded only on selection.
const DB='bv-ai-import-s3',VERSION=1;
export function openImportDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('catalog'))db.createObjectStore('catalog',{keyPath:'id'});if(!db.objectStoreNames.contains('messages'))db.createObjectStore('messages',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Transaction aborted'));});}
export async function saveImportedChats(chats,{signal}={}){
 const db=await openImportDB();let inserted=0;
 try{for(const c of chats){if(signal?.aborted)throw new DOMException('Aborted','AbortError');const tx=db.transaction(['catalog','messages'],'readwrite');tx.objectStore('catalog').put({id:c.id,title:c.title,messageCount:c.messageCount,source:c.source});tx.objectStore('messages').put({id:c.id,messages:c.messages});await txDone(tx);inserted++;}return inserted;}finally{db.close();}
}
export async function loadImportCatalog(){const db=await openImportDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('catalog').objectStore('catalog').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function loadImportedMessages(id){const db=await openImportDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('messages').objectStore('messages').get(id);r.onsuccess=()=>resolve(r.result?.messages||[]);r.onerror=()=>reject(r.error);});}finally{db.close();}}
