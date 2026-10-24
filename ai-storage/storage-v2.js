/* BV-Note AI Refactor S2: additive, opt-in IndexedDB; legacy localStorage untouched */
(function(root){'use strict';
 const DB='bvnote-ai-refactor-v2',VERSION=1;
 const stores={conversations:{keyPath:'id'},messages:{keyPath:'id'},attachments:{keyPath:'id'},transportChunks:{keyPath:'id'},retrievalChunks:{keyPath:'id'},migrationMeta:{keyPath:'id'}};
 function open(){return new Promise((resolve,reject)=>{
   if(!root.indexedDB)return reject(new Error('IndexedDB unavailable'));
   const req=indexedDB.open(DB,VERSION);
   req.onupgradeneeded=()=>{const db=req.result;for(const [name,options] of Object.entries(stores))if(!db.objectStoreNames.contains(name))db.createObjectStore(name,options)};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   req.onblocked=()=>reject(new Error('Database upgrade blocked'));
 });}
 function transaction(db,name,mode,work){return new Promise((resolve,reject)=>{
   const tx=db.transaction(name,mode),store=tx.objectStore(name);let value;
   try{value=work(store)}catch(e){tx.abort();reject(e);return}
   tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));
 });}
 async function health(){const db=await open();try{return {ok:true,version:db.version,stores:Object.keys(stores).filter(s=>db.objectStoreNames.contains(s))}}finally{db.close()}}
 // Explicit one-time COPY of legacy chats, never deleting/modifying legacy data.
 async function copyLegacy(){
   const raw=root.localStorage.getItem('bvnote-ai-chats-v358');
   if(!raw)return {ok:true,copied:0,reason:'no_legacy_data'};
   const chats=JSON.parse(raw);if(!Array.isArray(chats))throw Error('Legacy chats are not an array');
   const db=await open();try{
     let count=0;await new Promise((resolve,reject)=>{
       const tx=db.transaction(['conversations','messages','migrationMeta'],'readwrite');
       const cs=tx.objectStore('conversations'),ms=tx.objectStore('messages'),meta=tx.objectStore('migrationMeta');
       for(const c of chats){if(!c||typeof c.id!=='string'||!c.id||c.id.length>128)continue;
         cs.put({id:c.id,title:String(c.title||'Untitled').slice(0,250),source:'legacy-copy',createdAt:c.createdAt||null});
         if(Array.isArray(c.blocks))c.blocks.forEach((b,i)=>{
           ms.put({id:c.id+':'+i,conversationId:c.id,sequence:i,role:b.role==='Q'?'user':b.role==='A'?'assistant':'user',content:String(b.text||''),source:'legacy-copy'});
         });count++;
       }
       meta.put({id:'legacy-copy-v1',at:new Date().toISOString(),copied:count});
       tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
     });return {ok:true,copied:count,legacyPreserved:true};
   }finally{db.close()}
 }
 root.BV_AI_STORAGE_V2=Object.freeze({open,health,copyLegacy,dbName:DB});
})(window);
