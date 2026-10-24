/* AREA A-6A7FC0B1 START: explorer.js */
// AREA A02 START: ExplorerManager | File: explorer.js
'use strict';
(()=>{/* BLOCK B-C681CA29D7 START: AREA A-6A7FC0B1 */
const aside=document.querySelector('#explorer'),tree=document.querySelector('#tree'),rootLabel=document.querySelector('#root-label');
let root=null,selected=null,items=[],sequence=0,orderDirty=false;
// Virtual single-file root: all changes remain in IndexedDB until explicit Save.
let virtualRoot=false;
const DRAFT_DB='bv-note-single-file-drafts-v1';
function draftStore(value){/* BLOCK B-6267D82679 START: AREA A-6A7FC0B1 */
 return new Promise((resolve,reject)=>{/* BLOCK B-4A7D37C1FF START: AREA A-6A7FC0B1 */
  const request=indexedDB.open(DRAFT_DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'id'});
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{/* BLOCK B-2029A9C501 START: AREA A-6A7FC0B1 */
   const db=request.result,tx=db.transaction('drafts','readwrite');
   tx.objectStore('drafts').put(value);
   tx.oncomplete=()=>{/* BLOCK B-200C498312 START: AREA A-6A7FC0B1 */db.close();resolve()/* BLOCK B-200C498312 END. */};
   tx.onerror=()=>{/* BLOCK B-227B588F70 START: AREA A-6A7FC0B1 */db.close();reject(tx.error)/* BLOCK B-227B588F70 END. */};
  /* BLOCK B-2029A9C501 END. */};
 /* BLOCK B-4A7D37C1FF END. */});
/* BLOCK B-6267D82679 END. */}
function virtualFile(name,text){/* BLOCK B-D17A6547FF START: AREA A-6A7FC0B1 */
 let data=text;
 return {kind:'file',name,async getFile(){/* BLOCK B-24C9E033DE START: AREA A-6A7FC0B1 */return new File([data],name,{type:'text/plain'})/* BLOCK B-24C9E033DE END. */},
 async createWritable(){/* BLOCK B-50B4AE4096 START: AREA A-6A7FC0B1 */let next='';return {async write(v){/* BLOCK B-90C179CB56 START: AREA A-6A7FC0B1 */next=typeof v==='string'?v:await new Blob([v]).text()/* BLOCK B-90C179CB56 END. */},async close(){/* BLOCK B-3ACDBB4026 START: AREA A-6A7FC0B1 */data=next/* BLOCK B-3ACDBB4026 END. */}}/* BLOCK B-50B4AE4096 END. */}};
/* BLOCK B-D17A6547FF END. */}
async function openSingleFile(file){/* BLOCK B-8D881CAAE7 START: AREA A-6A7FC0B1 */
 rememberRoot();
 if(!file||!/\.(md|markdown|txt)$/i.test(file.name)){alert('單檔匯入支援 MD、Markdown、TXT');return}
 if(dirty&&!confirm('目前文件尚未儲存，仍要切換？'))return;
 const content=await file.text(),name=file.name;
 cloudVirtualId=null;virtualRoot=true;root={name:name.replace(/\.[^.]+$/,'')+' Root',kind:'directory'};
 rootSelected=false;rootCollapsed=false;items=[];selected=null;sequence=0;collapsed.clear();
 const x={id:++sequence,uuid:uuid(),name,handle:virtualFile(name,content),parent:null,kind:'file',order:1,buffer:content};
 items.push(x);nodeDB={version:1,rootId:uuid(),nodes:{[name]:x.uuid}};
 recordDB={version:2,files:{}};rootLabel.textContent=root.name+'（草稿）';
 await draftStore({id:x.uuid,name,rootName:root.name,content,updatedAt:Date.now()});
 await choose(x);dirty=true;refreshUnsaved();display();
 toast('單檔已匯入 IndexedDB 草稿；按 Save 才會寫入本地');
/* BLOCK B-8D881CAAE7 END. */}

// v3.7.8.1: full Cloud ZIP tree, kept only in IndexedDB (no filesystem writes).
let cloudVirtualId=null;
const CLOUD_DB='bv-note-cloud-roots-v378';
function cloudDB(){/* BLOCK B-948B4F6507 START: AREA A-6A7FC0B1 */return new Promise((resolve,reject)=>{/* BLOCK B-521DC3AC69 START: AREA A-6A7FC0B1 */const r=indexedDB.open(CLOUD_DB,1);r.onupgradeneeded=()=>{/* BLOCK B-07C6B3E5B9 START: AREA A-6A7FC0B1 */if(!r.result.objectStoreNames.contains('roots'))r.result.createObjectStore('roots')/* BLOCK B-07C6B3E5B9 END. */};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)/* BLOCK B-521DC3AC69 END. */})/* BLOCK B-948B4F6507 END. */}
async function cloudRead(key){/* BLOCK B-DA76AD161E START: AREA A-6A7FC0B1 */const db=await cloudDB();try{return await new Promise((resolve,reject)=>{/* BLOCK B-4657B2A34C START: AREA A-6A7FC0B1 */const q=db.transaction('roots').objectStore('roots').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)/* BLOCK B-4657B2A34C END. */})}finally{db.close()}/* BLOCK B-DA76AD161E END. */}
async function cloudWrite(key,value){/* BLOCK B-A77F2033C7 START: AREA A-6A7FC0B1 */const db=await cloudDB();try{await new Promise((resolve,reject)=>{/* BLOCK B-246AAE9FCB START: AREA A-6A7FC0B1 */const tx=db.transaction('roots','readwrite');tx.objectStore('roots').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)/* BLOCK B-246AAE9FCB END. */})}finally{db.close()}/* BLOCK B-A77F2033C7 END. */}
function memoryFile(name,bytes){/* BLOCK B-45F194B75D START: AREA A-6A7FC0B1 */let data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);return {kind:'file',name,async getFile(){/* BLOCK B-97AA4567EC START: AREA A-6A7FC0B1 */return new File([data],name)/* BLOCK B-97AA4567EC END. */},async createWritable(){/* BLOCK B-6BE354EAF2 START: AREA A-6A7FC0B1 */let next=data;return {async write(v){/* BLOCK B-EB05E7E345 START: AREA A-6A7FC0B1 */next=new Uint8Array(await new Blob([v]).arrayBuffer())/* BLOCK B-EB05E7E345 END. */},async close(){/* BLOCK B-96FC6EE372 START: AREA A-6A7FC0B1 */data=next/* BLOCK B-96FC6EE372 END. */}}/* BLOCK B-6BE354EAF2 END. */},bytes(){/* BLOCK B-C92CB4E9FE START: AREA A-6A7FC0B1 */return data/* BLOCK B-C92CB4E9FE END. */}}/* BLOCK B-45F194B75D END. */}
// Cloud directory handles implement Explorer's ordinary directory operations in memory.
function cloudDir(node=null){/* BLOCK B-E34F726A6E START: AREA A-6A7FC0B1 */return {kind:'directory',name:node?.name||root?.name||'Cloud',
 async *entries(){/* BLOCK B-E484864D2F START: AREA A-6A7FC0B1 */for(const n of siblings(node))yield [n.name,n.handle]/* BLOCK B-E484864D2F END. */},
 async getFileHandle(name,{create=false}={}){/* BLOCK B-BEA929C9DF START: AREA A-6A7FC0B1 */const n=siblings(node).find(n=>n.name===name);if(n){if(n.kind!=='file')throw Error('名稱為資料夾');return n.handle}if(create)return memoryFile(name,new Uint8Array());throw new DOMException('Not found','NotFoundError')/* BLOCK B-BEA929C9DF END. */},
 async getDirectoryHandle(name,{create=false}={}){/* BLOCK B-B8D2E303F5 START: AREA A-6A7FC0B1 */const n=siblings(node).find(n=>n.name===name);if(n){if(n.kind!=='directory')throw Error('名稱為文件');return n.handle}if(create)return cloudDir({name});throw new DOMException('Not found','NotFoundError')/* BLOCK B-B8D2E303F5 END. */},
 async removeEntry(name){/* BLOCK B-9B93CDEDCC START: AREA A-6A7FC0B1 */if(!siblings(node).some(n=>n.name===name))throw new DOMException('Not found','NotFoundError')/* BLOCK B-9B93CDEDCC END. */}
}/* BLOCK B-E34F726A6E END. */}
let cloudSaveTimer;
function queueCloudSave(){/* BLOCK B-0F5A5C9E6D START: AREA A-6A7FC0B1 */if(!cloudVirtualId||root?.cloudId!==cloudVirtualId)return;clearTimeout(cloudSaveTimer);cloudSaveTimer=setTimeout(async()=>{/* BLOCK B-5898DF5703 START: AREA A-6A7FC0B1 */try{const snap=await window.BVCloudExportVirtualRoot();await cloudWrite('bv378-root-'+snap.id,{id:snap.id,name:root.name,entries:snap.entries,updatedAt:Date.now()})}catch(e){console.error('Cloud Root autosave',e)}/* BLOCK B-5898DF5703 END. */},600)/* BLOCK B-0F5A5C9E6D END. */}
async function loadCloudRoot(saved){/* BLOCK B-7667D6DE5D START: AREA A-6A7FC0B1 */
 rememberRoot();virtualRoot=true;cloudVirtualId=saved.id;root={name:saved.name.replace(/\.zip$/i,'')+'（Cloud）',kind:'directory',cloudId:saved.id};Object.assign(root,cloudDir(null));
 rootSelected=false;rootCollapsed=false;items=[];selected=null;sequence=0;collapsed.clear();dirty=false;
 nodeDB={version:1,rootId:uuid(),nodes:{}};recordDB={version:2,files:{}};
 const directories=new Map();directories.set('',null);
 const addDir=key=>{/* BLOCK B-377FE82FD6 START: AREA A-6A7FC0B1 */if(directories.has(key))return directories.get(key);const segments=key.split('/');const name=segments.pop();const parent=addDir(segments.join('/'));const x={id:++sequence,uuid:uuid(),name,handle:null,parent,kind:'directory',order:sequence,buffer:null};x.handle=cloudDir(x);items.push(x);directories.set(key,x);nodeDB.nodes[key]=x.uuid;return x/* BLOCK B-377FE82FD6 END. */};
 for(const entry of saved.entries){if(entry.path===ORDER_FILE)continue;if(entry.dir){addDir(entry.path.replace(/\/$/,''));continue}const segments=entry.path.split('/');const name=segments.pop();if(!name)continue;const parent=segments.length?addDir(segments.join('/')):null;const x={id:++sequence,uuid:uuid(),name,handle:memoryFile(name,entry.data),parent,kind:'file',order:sequence,buffer:null};items.push(x);nodeDB.nodes[entry.path]=x.uuid}
 const orderRecord=saved.entries.find(e=>e.path===ORDER_FILE&&!e.dir);
 if(orderRecord){try{applyOrderMetadata(JSON.parse(new TextDecoder().decode(orderRecord.data)))}catch(e){console.warn('Cloud node order metadata invalid',e)}}
 // All imported Cloud Root folders start collapsed; no document auto-opens.
 for(const node of items)if(node.kind==='directory')collapsed.add(node.id);
 selected=null;rootSelected=false;rootCollapsed=false;
 rootLabel.textContent=root.name;setDocumentVisible(false);display();
 toast('雲端 Root 已載入，所有資料夾預設閉合（'+items.length+' 個節點）');
 rememberRoot();
/* BLOCK B-7667D6DE5D END. */}
window.BVCloudOpenVirtualRoot=async(id,name,entries)=>{/* BLOCK B-5A063C7F29 START: AREA A-6A7FC0B1 */
 if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Cloud ID 無效');
 const key='bv378-root-'+id,existing=await cloudRead(key);
 if(existing&&!confirm('同一 Fold Hash ID 已存在 IndexedDB。是否以雲端版本 REPLACE？現有草稿將被覆蓋。'))return false;
 if((dirty||items.some(x=>x.buffer!==null))&&!confirm('目前 Explorer 有未儲存修改，是否仍要切換？'))return false;
 const safe=entries.map(e=>{/* BLOCK B-471772DF34 START: AREA A-6A7FC0B1 */
  if(typeof e.path!=='string'||!e.path||e.path.includes('\0'))throw Error('不安全的 ZIP 路徑');
  const dir=!!e.dir,raw=e.path.replace(/\\/g,'/');
  if(raw.startsWith('/')||/^[A-Za-z]:/.test(raw))throw Error('不安全的 ZIP 路徑：'+e.path);
  const clean=dir?raw.replace(/\/+$/,''):raw;
  const segments=clean.split('/');
  if(!clean||segments.some(v=>!v||v==='.'||v==='..'))throw Error('不安全的 ZIP 路徑：'+e.path);
  return {path:clean+(dir?'/':''),data:e.data,dir};
 /* BLOCK B-471772DF34 END. */});
 const saved={id,name,entries:safe,updatedAt:Date.now()};await cloudWrite(key,saved);await loadCloudRoot(saved);return true;
/* BLOCK B-5A063C7F29 END. */};
window.BVCloudExportVirtualRoot=async()=>{/* BLOCK B-6C8D776EC8 START: AREA A-6A7FC0B1 */
 if(!cloudVirtualId||root?.cloudId!==cloudVirtualId)throw Error('目前未選取雲端虛擬 Root');
 const x=current();if(x?.kind==='file'&&dirty)x.buffer=sourceArea.style.display==='none'?rawMarkdown:sourceArea.value;
 const entries=[];for(const node of items.filter(n=>n.kind==='directory'))entries.push({path:path(node)+'/',dir:true});for(const node of items.filter(n=>n.kind==='file')){
  const data=node.buffer!==null?new TextEncoder().encode(node.buffer):node.handle.bytes();
  entries.push({path:path(node),data});
 }
 entries.push(orderEntry());return {id:cloudVirtualId,name:root.name.replace(/（Cloud）$/,'')+'.zip',entries};
/* BLOCK B-6C8D776EC8 END. */};
window.BVCloudRestoreVirtualRoot=async(id)=>{/* BLOCK B-9C9ADE08B8 START: AREA A-6A7FC0B1 */const saved=await cloudRead('bv378-root-'+id);if(!saved)throw Error('IndexedDB 中找不到此 Cloud Root');if((dirty||items.some(x=>x.buffer!==null))&&!confirm('目前有未儲存修改，是否仍要切換？'))return false;await loadCloudRoot(saved);return true/* BLOCK B-9C9ADE08B8 END. */};
const singlePicker=document.createElement('input');singlePicker.type='file';
singlePicker.accept='.md,.markdown,.txt';singlePicker.hidden=true;document.body.append(singlePicker);
document.querySelector('#root-import-file').onclick=()=>{/* BLOCK B-7CA8CEE5BB START: AREA A-6A7FC0B1 */if(cloudVirtualId&&root?.cloudId===cloudVirtualId){cloudImport.value='';cloudImport.click()}else{singlePicker.value='';singlePicker.click()}/* BLOCK B-7CA8CEE5BB END. */};
singlePicker.onchange=()=>openSingleFile(singlePicker.files[0]).catch(e=>alert(e.message));
const cloudImport=document.createElement('input');cloudImport.type='file';cloudImport.multiple=true;cloudImport.hidden=true;document.body.append(cloudImport);
const cloudFolderPicker=document.createElement('input');cloudFolderPicker.type='file';cloudFolderPicker.multiple=true;cloudFolderPicker.webkitdirectory=true;cloudFolderPicker.hidden=true;document.body.append(cloudFolderPicker);
const cloudFolderButton=document.createElement('button');cloudFolderButton.type='button';cloudFolderButton.textContent='導入 Fold 至 Cloud';cloudFolderButton.title='將本地資料夾導入目前 Cloud Root 的選取位置（僅 IndexedDB）';
document.querySelector('#root-import-file').after(cloudFolderButton);
cloudFolderButton.onclick=()=>{/* BLOCK B-880BBCE340 START: AREA A-6A7FC0B1 */if(!cloudVirtualId||root?.cloudId!==cloudVirtualId)return alert('請先選取 Cloud Root');cloudFolderPicker.value='';cloudFolderPicker.click()/* BLOCK B-880BBCE340 END. */};
cloudFolderPicker.onchange=async()=>{/* BLOCK B-CB29A6CBC6 START: AREA A-6A7FC0B1 */if(!cloudVirtualId||root?.cloudId!==cloudVirtualId)return;const active=current(),base=rootSelected?null:(active?.kind==='directory'?active:active?.parent||null);try{
 const files=[...cloudFolderPicker.files];if(files.reduce((n,f)=>n+f.size,0)>100*1024*1024)throw Error('單次導入超過 100 MiB');
 const dirs=new Map();dirs.set('',base);
 function ensureDir(parts){/* BLOCK B-9D860A2C34 START: AREA A-6A7FC0B1 */let parent=base,key='';for(const name of parts){if(!name||name==='.'||name==='..'||/[\\/\x00-\x1f]/.test(name))throw Error('資料夾名稱無效');key+=(key?'/':'')+name;if(dirs.has(key)){parent=dirs.get(key);continue}let node=siblings(parent).find(n=>n.name===name);if(node&&node.kind!=='directory')throw Error('名稱衝突：'+name);if(!node){node={id:++sequence,uuid:uuid(),name,parent,kind:'directory',order:sequence,buffer:null};node.handle=cloudDir(node);items.push(node);nodeDB.nodes[path(node)]=node.uuid}dirs.set(key,node);parent=node}return parent/* BLOCK B-9D860A2C34 END. */}
 for(const file of files){const parts=file.webkitRelativePath.split('/');const name=parts.pop();const parent=ensureDir(parts);if(siblings(parent).some(n=>n.name===name))throw Error('同名文件：'+name);const node={id:++sequence,uuid:uuid(),name,parent,kind:'file',order:sequence,buffer:null,handle:memoryFile(name,new Uint8Array(await file.arrayBuffer()))};items.push(node);nodeDB.nodes[path(node)]=node.uuid}
 orderDirty=true;display();queueCloudSave();toast('已導入 Cloud Fold（'+files.length+' 個文件）')
 }catch(e){alert('導入 Fold 失敗：'+e.message)}/* BLOCK B-CB29A6CBC6 END. */};

cloudImport.onchange=async()=>{/* BLOCK B-3D15A8F236 START: AREA A-6A7FC0B1 */const x=current(),parent=rootSelected?null:(x?.kind==='directory'?x:x?.parent||null),files=[...cloudImport.files];try{
 if(!cloudVirtualId||root?.cloudId!==cloudVirtualId)throw Error('請先選取 Cloud Root');
 if(files.some(f=>!f.name||f.name==='.'||f.name==='..'||/[\\/\x00-\x1f]/.test(f.name)))throw Error('不合法的文件名稱');
 if(files.some(f=>siblings(parent).some(n=>n.name===f.name)))throw Error('目的資料夾有同名文件');
 if(files.reduce((n,f)=>n+f.size,0)>100*1024*1024)throw Error('單次導入超過 100 MiB');
 for(const f of files){const n={id:++sequence,uuid:uuid(),name:f.name,handle:memoryFile(f.name,new Uint8Array(await f.arrayBuffer())),parent,kind:'file',order:sequence,buffer:null};items.push(n);nodeDB.nodes[path(n)]=n.uuid}
 if(parent)collapsed.delete(parent.id);orderDirty=true;display();queueCloudSave();toast('已導入 '+files.length+' 個文件至 IndexedDB')
 }catch(e){alert('Cloud 導入失敗：'+e.message)}/* BLOCK B-3D15A8F236 END. */};

async function saveVirtual(){/* BLOCK B-26AC44A1E1 START: AREA A-6A7FC0B1 */
 const x=current();if(x?.kind==='file')x.buffer=sourceArea.style.display==='none'?rawMarkdown:sourceArea.value;
 if(cloudVirtualId&&root?.cloudId===cloudVirtualId){
  const entries=[];for(const node of items.filter(n=>n.kind==='directory'))entries.push({path:path(node)+'/',dir:true});for(const node of items.filter(n=>n.kind==='file')){
   const bytes=node.buffer!==null?new TextEncoder().encode(node.buffer):node.handle.bytes();
   entries.push({path:path(node),data:bytes});node.handle=memoryFile(node.name,bytes);node.buffer=null;
  }
  entries.push(orderEntry());await cloudWrite('bv378-root-'+cloudVirtualId,{id:cloudVirtualId,name:root.name,entries,updatedAt:Date.now()});
  orderDirty=false;dirty=false;refreshUnsaved();rememberRoot();toast('已將完整 Cloud Root 草稿儲存至 IndexedDB（未寫入本地資料夾）');return;
 }
 if(!x)return;const content=x.buffer??(sourceArea.style.display==='none'?rawMarkdown:sourceArea.value);
 await draftStore({id:x.uuid,name:x.name,rootName:root.name,content,updatedAt:Date.now()});
 if(!window.showSaveFilePicker){const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=x.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
 else{try{const dest=await showSaveFilePicker({suggestedName:x.name,types:[{description:'Markdown / Text',accept:{'text/plain':['.md','.markdown','.txt']}}]});const writer=await dest.createWritable();await writer.write(content);await writer.close()}catch(err){if(err.name==='AbortError')return;throw err}}
 x.handle=virtualFile(x.name,content);x.buffer=null;dirty=false;refreshUnsaved();toast('已儲存本地文件：'+x.name);
/* BLOCK B-26AC44A1E1 END. */}

let rootSelected=false;const SESSION_KEY="bv-note-session-v241";
let batchMode=false;const checkedIds=new Set();let clipboard=null;
const ORDER_FILE=".bv-note-explorer-order.json";
// sEAPP v3.9.3: per-folder ordering survives ZIP, IndexedDB and local Root reload.
let orderingParent=null,orderingActive=false;
function orderMetadata(){
 const paths=[];const ids=[];
 const walk=p=>{for(const n of siblings(p)){paths.push(path(n));ids.push(n.uuid);if(n.kind==='directory')walk(n)}};
 walk(null);return {version:3,ids,paths};
}
function applyOrderMetadata(data){
 if(!data||(!Array.isArray(data.paths)&&!Array.isArray(data.ids)))return;
 const rankByPath=new Map((data.paths||[]).map((v,i)=>[v,i]));
 const rankById=new Map((data.ids||[]).map((v,i)=>[v,i]));
 for(const n of items){const r=rankByPath.get(path(n))??rankById.get(n.uuid);if(r!==undefined)n.order=r;else n.order=100000+n.order}
 normalizeOrders();
}
async function persistOrderChange(){
 orderDirty=true;
 if(cloudVirtualId&&root?.cloudId===cloudVirtualId){queueCloudSave();return}
 if(!virtualRoot){await saveOrders()}
}
function reorderSibling(moving,target){
 if(!moving||!target||moving===target||moving.parent!==target.parent)return false;
 const peers=siblings(target.parent).filter(n=>n!==moving);
 peers.splice(peers.indexOf(target),0,moving);
 peers.forEach((n,i)=>n.order=i+1);return true;
}
async function adjustNodes(folder){
 if(!root)return alert('請先選取 Root');
 if(folder&&folder.kind!=='directory')folder=folder.parent;
 if(orderingActive&&orderingParent===(folder||null)){orderingActive=false;orderingParent=null;display();toast('已結束節點排序模式');return}
 orderingParent=folder||null;orderingActive=true;
 display();toast('節點排序模式：長按拖曳同層項目，或使用上下箭頭。再次選取「調整節點」結束');
}
async function shiftNode(n,delta){
 const peers=siblings(n.parent),i=peers.indexOf(n),j=i+delta;
 if(j<0||j>=peers.length)return;
 [peers[i],peers[j]]=[peers[j],peers[i]];
 peers.forEach((x,k)=>x.order=k+1);
 await persistOrderChange();display();
}
function orderEntry(){
 return {path:ORDER_FILE,data:new TextEncoder().encode(JSON.stringify(orderMetadata(),null,2))};
}

const RECORD_FILE=".bv-note-records.json";
// Stable UUIDs are random identifiers (not content hashes); persisted in Root metadata.
const ID_FILE='.bv-note-node-ids.json';
let nodeDB={version:1,rootId:null,nodes:{}};
let recordDB={version:2,files:{}};
let recordWrite=Promise.resolve(),nodeWrite=Promise.resolve();
const uuid=()=>crypto.randomUUID();
async function writeJSON(target,name,data){/* BLOCK B-AA56E4411D START: AREA A-6A7FC0B1 */const h=await target.getFileHandle(name,{create:true});const w=await h.createWritable();await w.write(JSON.stringify(data,null,2));await w.close()/* BLOCK B-AA56E4411D END. */}
async function flushRecordDB(){/* BLOCK B-14E7D87CA9 START: AREA A-6A7FC0B1 */if(!root||virtualRoot)return;const target=root,payload=structuredClone(recordDB);recordWrite=recordWrite.catch(()=>{/* BLOCK B-DC70EA256C END. *//* BLOCK B-DC70EA256C START: AREA A-6A7FC0B1 */}).then(()=>writeJSON(target,RECORD_FILE,payload));return recordWrite;/* BLOCK B-14E7D87CA9 END. */}
async function flushNodeDB(){/* BLOCK B-B2A32B9CD3 START: AREA A-6A7FC0B1 */if(!root||virtualRoot)return;const target=root,payload=structuredClone(nodeDB);nodeWrite=nodeWrite.catch(()=>{/* BLOCK B-6507D369C4 END. *//* BLOCK B-6507D369C4 START: AREA A-6A7FC0B1 */}).then(()=>writeJSON(target,ID_FILE,payload));return nodeWrite;/* BLOCK B-B2A32B9CD3 END. */}
function canonicalRecordKey(key){/* BLOCK B-E1F5CED091 START: AREA A-6A7FC0B1 */if(!key)return '';const prefix=root?.name+'/';if(prefix&&key.startsWith(prefix))return key.slice(prefix.length);const exact=items.filter(x=>x.kind==='file').map(x=>path(x));return exact.find(p=>key===p||key.endsWith('/'+p))||key;/* BLOCK B-E1F5CED091 END. */}
async function loadNodeDB(){/* BLOCK B-8A7F2239B0 START: AREA A-6A7FC0B1 */
 nodeDB={version:1,rootId:null,nodes:{}};
 try{const data=JSON.parse(await(await root.getFileHandle(ID_FILE)).getFile().then(f=>f.text()));if(data?.nodes&&typeof data.nodes==='object')nodeDB=data}catch(e){if(e.name!=='NotFoundError')console.warn('ID load failed',e)}
 let changed=false;
 if(!nodeDB.rootId){nodeDB.rootId=uuid();changed=true}
 const existing=new Set();const used=new Set([nodeDB.rootId]);
 for(const x of items){const key=path(x);existing.add(key);let id=nodeDB.nodes[key];if(!id||used.has(id)){id=uuid();changed=true}used.add(id);x.uuid=id;if(nodeDB.nodes[key]!==id){nodeDB.nodes[key]=id;changed=true}}
 for(const key of Object.keys(nodeDB.nodes))if(!existing.has(key)){delete nodeDB.nodes[key];changed=true}
 if(changed)await flushNodeDB();
/* BLOCK B-8A7F2239B0 END. */}
async function loadRecordDB(){/* BLOCK B-EC86773141 START: AREA A-6A7FC0B1 */
 recordDB={version:2,files:{}};
 try{const data=JSON.parse(await(await root.getFileHandle(RECORD_FILE)).getFile().then(f=>f.text()));if(data?.files&&typeof data.files==='object')recordDB=data}catch(e){if(e.name!=='NotFoundError')console.warn('Record load failed',e)}
 let changed=recordDB.version!==2;const result={};const score=v=>(v?.toc?.length||0)+(v?.notes?.length||0);
 for(const [key,value] of Object.entries(recordDB.files)){
  const node=items.find(x=>x.kind==='file'&&(key===x.uuid||canonicalRecordKey(key)===path(x)));
  const id=node?.uuid||key;
  if(id!==key)changed=true;
  if(!result[id]||score(value)>score(result[id]))result[id]=value;
 }
 recordDB={version:2,files:result};if(changed)await flushRecordDB();
/* BLOCK B-EC86773141 END. */}
function resolveRecordId(key){/* BLOCK B-4359164BA3 START: AREA A-6A7FC0B1 */return items.find(x=>x.kind==='file'&&(x.uuid===key||path(x)===canonicalRecordKey(key)))?.uuid||key/* BLOCK B-4359164BA3 END. */}
window.BVGetFileRecords=key=>recordDB.files[resolveRecordId(key)]||null;
window.BVPutFileRecords=(key,value)=>{/* BLOCK B-F95D77AC7F START: AREA A-6A7FC0B1 */if(!root||!key)return Promise.resolve();recordDB.files[resolveRecordId(key)]=value;return flushRecordDB().catch(e=>{/* BLOCK B-09E97CD129 START: AREA A-6A7FC0B1 */status('目錄/標註儲存失敗：'+e.message);throw e/* BLOCK B-09E97CD129 END. */})/* BLOCK B-F95D77AC7F END. */};
window.BVGetCurrentFileId=()=>current()?.uuid||null;
window.BVCloudLocalSelection=async()=>{/* BLOCK B-C4F09400ED START: AREA A-6A7FC0B1 */const x=current();if(!root||!x||x.kind!=='file')throw Error('請先在 Explorer 選取本地 File');const file=await x.handle.getFile();return {id:x.uuid,name:x.name,path:path(x),text:x.buffer!==null?x.buffer:await file.text(),unsaved:dirty&&selected===x.id,rootName:root.name};/* BLOCK B-C4F09400ED END. */};
window.BVCloudLocalFolder=async()=>{/* BLOCK B-5DDC6E6A4C START: AREA A-6A7FC0B1 */if(!root)throw Error('請先選取本地 Root');const x=current();if(!rootSelected&&x?.kind!=='directory')throw Error('請在 Explorer 選取 Root 或 Fold');const folder=rootSelected?null:x;const prefix=folder?path(folder)+'/':'';const files=[];for(const n of items.filter(n=>n.kind==='file'&&(!folder||isChild(n,folder)))){const file=await n.handle.getFile();files.push({id:n.uuid,name:n.name,path:folder?path(n).slice(prefix.length):path(n),text:n.buffer!==null?n.buffer:await file.text()});}return {name:folder?.name||root.name,files};/* BLOCK B-5DDC6E6A4C END. */};
window.BVCloudFolderHandle=()=>{/* BLOCK B-84918F2C0E START: AREA A-6A7FC0B1 */const x=current();if(!root||(!rootSelected&&!x))throw Error('請先選擇上傳文件');if(rootSelected)return {handle:root,name:root.name};if(x?.kind==='directory')return {handle:x.handle,name:x.name};if(x?.kind==='file')return {handle:root,name:root.name};throw Error('請先選擇上傳文件')/* BLOCK B-84918F2C0E END. */};
window.BVCloudHasSelection=()=>!!root&&(rootSelected||!!current());
window.BVCloudRootHandle=()=>{/* BLOCK B-B0EABC8574 START: AREA A-6A7FC0B1 */if(!root)throw Error('請先開啟本地 Root');return {handle:root,name:root.name}/* BLOCK B-B0EABC8574 END. */};
window.BVCloudImportText=async(name,text)=>{/* BLOCK B-018C899637 START: AREA A-6A7FC0B1 */if(!root)throw Error('請先選取本地 Root');const safe=String(name||'cloud.md').replace(/[\\/]/g,'_');if(!/\.(md|txt)$/i.test(safe))throw Error('僅支援 Markdown 或 TXT');let target=safe,i=1;while(true){try{await root.getFileHandle(target);target=safe.replace(/(\.[^.]+)$/,`_cloud${i++}$1`);}catch(e){if(e.name==='NotFoundError')break;throw e;}}const handle=await root.getFileHandle(target,{create:true});const w=await handle.createWritable();await w.write(text);await w.close();await syncExternal();return target;/* BLOCK B-018C899637 END. */};
function captureRecordPaths(node){/* BLOCK B-4622D18037 START: AREA A-6A7FC0B1 */return [node,...items.filter(y=>isChild(y,node))].map(y=>({node:y,old:path(y)}));/* BLOCK B-4622D18037 END. */}
async function relocateRecords(snapshot,copy=false){/* BLOCK B-E0A475AE3E START: AREA A-6A7FC0B1 */
 if(!root||!snapshot?.length)return;
 for(const entry of snapshot){const x=entry.node,from=entry.old,to=path(x);if(copy){const previous=x.uuid;x.uuid=uuid();if(x.kind==='file'&&recordDB.files[previous])recordDB.files[x.uuid]=structuredClone(recordDB.files[previous]);}else if(readingPositions.has(from)){readingPositions.set(to,readingPositions.get(from));readingPositions.delete(from)}
  delete nodeDB.nodes[from];nodeDB.nodes[to]=x.uuid;
 }
 await flushNodeDB();await flushRecordDB();
/* BLOCK B-E0A475AE3E END. */}
function normalizeOrders(){/* BLOCK B-B75E74F8FE START: AREA A-6A7FC0B1 */const parents=[null,...items.filter(x=>x.kind==='directory')];for(const p of parents)siblings(p).forEach((x,i)=>x.order=i+1)/* BLOCK B-B75E74F8FE END. */}
async function loadOrders(){/* BLOCK B-0D2D34BB51 START: AREA A-6A7FC0B1 */try{const h=await root.getFileHandle(ORDER_FILE);const data=JSON.parse(await(await h.getFile()).text());if(!Array.isArray(data.ids)&&!Array.isArray(data.paths))return;applyOrderMetadata(data)}catch(e){if(e.name!=='NotFoundError')console.warn('Explorer order load:',e)}/* BLOCK B-0D2D34BB51 END. */}
async function saveOrders(){/* BLOCK B-92E3090C2B START: AREA A-6A7FC0B1 */if(virtualRoot)return;normalizeOrders();const data=orderMetadata();const h=await root.getFileHandle(ORDER_FILE,{create:true});const w=await h.createWritable();await w.write(JSON.stringify(data,null,2));await w.close();orderDirty=false;/* BLOCK B-92E3090C2B END. */}
const collapsed=new Set();let rootCollapsed=false;
const edge=document.querySelector('#sider-edge');
const closeSider=document.querySelector('#sider-close');
function setSider(open){/* BLOCK B-F811CB37C5 START: AREA A-6A7FC0B1 */aside.classList.toggle('collapsed',!open);document.querySelector('.workspace').classList.toggle('explorer-hidden',!open);edge.setAttribute('aria-expanded',String(open));edge.title=open?'Explorer 已開啟':'開啟 Explorer';/* BLOCK B-F811CB37C5 END. */}
window.BVToggleExplorer=()=>setSider(aside.classList.contains('collapsed'));
window.BVSetExplorerOpen=setSider;
edge.onclick=window.BVToggleExplorer;
closeSider.onclick=()=>setSider(false);
// Resizable sider using pointer events, preserving independent scroll containers.
const grip=document.querySelector('#sider-resizer');
let dragId=null;grip.addEventListener('pointerdown',ev=>{/* BLOCK B-F3FFFA3FD4 START: AREA A-6A7FC0B1 */if(aside.classList.contains('collapsed'))return;dragId=ev.pointerId;grip.setPointerCapture(dragId);document.body.classList.add('resizing-sider');ev.preventDefault()/* BLOCK B-F3FFFA3FD4 END. */});
grip.addEventListener('pointermove',ev=>{/* BLOCK B-7C9E0FF680 START: AREA A-6A7FC0B1 */if(dragId!==ev.pointerId)return;const width=Math.max(190,Math.min(window.innerWidth-180,ev.clientX-aside.getBoundingClientRect().left));aside.style.width=width+'px';try{localStorage.setItem('bv-note-sider-width',String(width))}catch{}/* BLOCK B-7C9E0FF680 END. */});
const stopDrag=()=>{/* BLOCK B-6671261713 START: AREA A-6A7FC0B1 */dragId=null;document.body.classList.remove('resizing-sider')/* BLOCK B-6671261713 END. */};grip.addEventListener('pointerup',stopDrag);grip.addEventListener('pointercancel',stopDrag);
try{const w=Number(localStorage.getItem('bv-note-sider-width'));if(w>=190)aside.style.width=Math.min(w,window.innerWidth-180)+'px'}catch{}
let touchX=null;aside.addEventListener('touchstart',ev=>{/* BLOCK B-F95EFFADCB START: AREA A-6A7FC0B1 */if(ev.touches.length===1)touchX=ev.touches[0].clientX/* BLOCK B-F95EFFADCB END. */},{passive:true});aside.addEventListener('touchend',ev=>{/* BLOCK B-C4F779996C START: AREA A-6A7FC0B1 */if(touchX!==null&&ev.changedTouches.length===1&&touchX-ev.changedTouches[0].clientX>100)setSider(false);touchX=null/* BLOCK B-C4F779996C END. */},{passive:true});
// The editor is hidden until a document is selected or explicitly opened/created.
const main=document.querySelector('.workspace main');
const emptyNotice=document.createElement('div');emptyNotice.id='empty-document-notice';emptyNotice.textContent='請創建新文檔或使用「設定」開啟舊文檔\n複製貼上AI聊天內容請確保為完整的md格式';main.append(emptyNotice);
const unsaved=document.createElement('span');unsaved.id='unsaved-notice';unsaved.textContent='[!] 文件未保存';document.querySelector('.editor-topbar').append(unsaved);
let documentVisible=false;
function setDocumentVisible(visible){/* BLOCK B-7C682DE530 START: AREA A-6A7FC0B1 */documentVisible=Boolean(visible);main.classList.toggle('no-document',!documentVisible);refreshUnsaved()/* BLOCK B-7C682DE530 END. */}
function refreshUnsaved(){/* BLOCK B-5CD77D2183 START: AREA A-6A7FC0B1 */unsaved.hidden=!documentVisible||!dirty/* BLOCK B-5CD77D2183 END. */}
window.BVSetDocumentVisible=setDocumentVisible;
window.BVRefreshUnsaved=refreshUnsaved;
setDocumentVisible(false);
const editableExt=/\.(md|markdown|txt|ainote)$/i;
const isPdfFile=name=>/\.pdf$/i.test(name||'');
const toast=s=>status(s);
function switchMode(mode, preserveLoadedMarkdown=false){/* BLOCK B-E0FB9CE775 START: AREA A-6A7FC0B1 */if(window.BVPdfViewer?.active){window.BVPdfViewer.hide()}const edit=mode==='edit';try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({mode,rootName:root?.name||'',fileUUID:current()?.uuid||null,raw:edit?sourceArea.value:rawMarkdown}))}catch{};sourceArea.style.display=edit?'block':'none';editor.style.display=edit?'none':'block';editor.contentEditable='false';sourceButton.textContent=edit?'Commit':'Edit';sourceButton.title=edit?'儲存本地文件並切換至瀏覽模式':'切換至本地編輯模式';sourceButton.classList.toggle('commit-mode',edit);sourceButton.classList.toggle('edit-mode',!edit);if(edit){sourceArea.value=rawMarkdown;}else{if(!preserveLoadedMarkdown)rawMarkdown=sourceArea.value;renderRaw();setTimeout(()=>window.BVRefreshFileRecords?.(),50);}document.querySelector('#mode-indicator').textContent='';refreshUnsaved();/* BLOCK B-E0FB9CE775 END. */}
window.BVSaveSelectedFile=async(content)=>{/* BLOCK B-F9507E5AB7 START: AREA A-6A7FC0B1 */if(virtualRoot){sourceArea.value=content;await saveVirtual();return true;}
 const x=current();
 if(!x||x.kind!=='file'||handle!==x.handle)return null;
 try{const w=await x.handle.createWritable();await w.write(content);await w.close();await window.BVFlushFileRecords?.();x.buffer=null;dirty=false;status('已儲存：'+x.name);refreshUnsaved();return true;}
 catch(e){alert('儲存失敗：'+e.message);return false;}
/* BLOCK B-F9507E5AB7 END. */};
sourceButton.onclick=async()=>{/* BLOCK B-AC437041CD START: AREA A-6A7FC0B1 */
 if(window.BVPdfViewer?.active)return;
 // Local mode only: Commit saves Markdown and enters preview; Edit returns to editor.
 if(sourceArea.style.display==='none'){switchMode('edit');return;}
 const nextRaw=sourceArea.value;
 const ok=await save();
 if(!ok)return;
 rawMarkdown=nextRaw;
 switchMode('view',true);
 refreshUnsaved();
/* BLOCK B-AC437041CD END. */};
editor.contentEditable='false';switchMode('edit');
// New document transaction: choose parent -> create Root -> create Markdown -> display.
window.BVCreateNewDocument=async()=>{/* BLOCK B-20FE486753 START: AREA A-6A7FC0B1 */
 if(!window.showDirectoryPicker){alert('此瀏覽器不支援選取並寫入本地資料夾。請使用支援 File System Access API 的 Chrome/Edge HTTPS 版本。');return false;}
 if(dirty&&!confirm('目前文件尚未保存，仍要建立新文件？'))return false;
 let parent;
 try{parent=await window.showDirectoryPicker({mode:'readwrite'});}catch(e){if(e.name!=='AbortError')alert('選擇儲存路徑失敗：'+e.message);return false;}
 try{
  // Do not overwrite a previously created folder or file.
  let folderName='新檔案',index=2,folder;
  while(true){
   try{await parent.getDirectoryHandle(folderName);folderName='新檔案 ('+(index++)+')';continue;}
   catch(e){if(e.name!=='NotFoundError')throw e;}
   try{await parent.getFileHandle(folderName);folderName='新檔案 ('+(index++)+')';continue;}
   catch(e){if(e.name!=='NotFoundError')throw e;}
   folder=await parent.getDirectoryHandle(folderName,{create:true});break;
  }
  const file=await folder.getFileHandle('新文件.md',{create:true});
  const writer=await file.createWritable();await writer.write('');await writer.close();
  root=folder;rootCollapsed=false;readingPositions.clear();readingRestoreToken++;readingRestoring=false;items=[];selected=null;sequence=0;resetBatch();collapsed.clear();orderDirty=false;
  rootLabel.textContent=folder.name;
  const x={id:++sequence,uuid:uuid(),name:'新文件.md',handle:file,parent:null,kind:'file',order:1,buffer:null};nodeDB={version:1,rootId:uuid(),nodes:{'新文件.md':x.uuid}};await flushNodeDB();
  items.push(x);
  handle=null;rawMarkdown='';dirty=false;
  await choose(x);
  switchMode('edit');
  display();toast('已建立 '+folder.name+'/新文件.md');
  return true;
 }catch(e){alert('建立新文件失敗：'+e.message);return false;}
/* BLOCK B-20FE486753 END. */};
window.BVDetachExplorerSelection=()=>{/* BLOCK B-1BC373A733 START: AREA A-6A7FC0B1 */selected=null;display()/* BLOCK B-1BC373A733 END. */};
function current(){/* BLOCK B-E1FB361D8A START: AREA A-6A7FC0B1 */return items.find(x=>x.id===selected)/* BLOCK B-E1FB361D8A END. */}
function path(x){/* BLOCK B-C537FF3D7A START: AREA A-6A7FC0B1 */let parts=[x.name],p=x.parent;while(p){parts.unshift(p.name);p=p.parent;}return parts.join('/');/* BLOCK B-C537FF3D7A END. */}
function siblings(p){/* BLOCK B-03B1BF283F START: AREA A-6A7FC0B1 */return items.filter(x=>x.parent===p).sort((a,b)=>a.order-b.order)/* BLOCK B-03B1BF283F END. */}
async function scan(dir,parent){/* BLOCK B-DE8438BDAB START: AREA A-6A7FC0B1 */for await(const [n,h] of dir.entries()){if(h.kind!=='directory'&&!/\.(md|txt|pdf)$/i.test(n))continue;const x={id:++sequence,name:n,handle:h,parent,kind:h.kind,order:sequence,buffer:null};items.push(x);if(h.kind==='directory')await scan(h,x)}/* BLOCK B-DE8438BDAB END. */}
async function renameRoot(proposedName){/* BLOCK B-7F20F2F351 START: AREA A-6A7FC0B1 */
 if(!root)return;
 const oldRoot=root,oldName=oldRoot.name;
 const name=proposedName===undefined?await inlineName('重新命名 Root',oldName):String(proposedName).trim();
 if(!name||name===oldName)return;
 if(/[\\/]/.test(name)||name==='.'||name==='..')return alert('名稱無效');
 if(cloudVirtualId&&root?.cloudId===cloudVirtualId){root.name=name.endsWith('（Cloud）')?name:name+'（Cloud）';rootLabel.textContent=root.name;display();queueCloudSave();return;}
 try{
  await saveAll();await window.BVFlushFileRecords?.();await flushNodeDB();await flushRecordDB();
  if(typeof oldRoot.move==='function'){
   await oldRoot.move(name);
   rootLabel.textContent=root.name;display();toast('Root 已重新命名為 '+root.name);return;
  }
  // A parent directory grant is required for physical rename where move() is unsupported.
  if(!window.showDirectoryPicker){alert('此瀏覽器不支援重新命名資料夾');return;}
  if(!confirm('此瀏覽器不支援原生 Root 重新命名。\n可手動選取 Root 的「上一層資料夾」來執行安全複製。\n系統將先驗證新 Root 的所有檔案；舊 Root 不會自動刪除，以免資料遺失。\n\n是否繼續？'))return;
  const parent=await showDirectoryPicker({mode:'readwrite'});
  let source;
  try{source=await parent.getDirectoryHandle(oldName)}catch{throw Error('選取的不是原 Root 的上一層資料夾，操作已取消')}
  if(!(await source.isSameEntry(oldRoot)))throw Error('選取的上一層資料夾不包含目前 Root，操作已取消');
  try{await parent.getDirectoryHandle(name);throw Error('目標 Root 名稱已存在，為避免覆寫已取消')}catch(e){if(e.name!=='NotFoundError')throw e}
  const target=await parent.getDirectoryHandle(name,{create:true});
  async function copyVerify(src,dst){/* BLOCK B-DE362462B5 START: AREA A-6A7FC0B1 */
   for await(const [entryName,h] of src.entries()){
    if(h.kind==='directory'){const d=await dst.getDirectoryHandle(entryName,{create:true});await copyVerify(h,d)}
    else{const file=await h.getFile();const out=await dst.getFileHandle(entryName,{create:true});const w=await out.createWritable();await w.write(await file.arrayBuffer());await w.close();const verify=await out.getFile();if(verify.size!==file.size)throw Error('複製驗證失敗：'+entryName)}
   }
  /* BLOCK B-DE362462B5 END. */}
  await copyVerify(oldRoot,target);
  root=target;await openRootFromHandle(target);
  alert('新 Root「'+name+'」已建立並驗證。\n舊 Root「'+oldName+'」已保留作為備份，請確認目錄與標註正常後，再自行刪除舊資料夾。');
 }catch(e){if(e.name!=='AbortError')alert('Root 重新命名失敗：'+e.message)}
/* BLOCK B-7F20F2F351 END. */}
// AREA MULTIROOT START: independent Root workspaces and active-file routing.
const rootWorkspaces=[];
let switchingRoot=false;
function snapshotRoot(){/* BLOCK B-6465C14776 START: AREA A-6A7FC0B1 */
 if(!root)return null;
 const active=current();
 if(active?.kind==='file'&&dirty)active.buffer=sourceArea.style.display==='none'?rawMarkdown:sourceArea.value;
 return {root,items,selected,sequence,orderDirty,virtualRoot,rootSelected,rootCollapsed,
  collapsed:new Set(collapsed),nodeDB,recordDB,recordWrite,nodeWrite,
  activeUUID:active?.kind==='file'?active.uuid:null};
/* BLOCK B-6465C14776 END. */}
function rememberRoot(){/* BLOCK B-90DFDA6E57 START: AREA A-6A7FC0B1 */const snap=snapshotRoot();if(!snap)return;
 const i=rootWorkspaces.findIndex(w=>w.root===root);
 if(i<0)rootWorkspaces.push(snap);else rootWorkspaces[i]=snap;
/* BLOCK B-90DFDA6E57 END. */}
async function activateRoot(target){/* BLOCK B-46FC5B1B7B START: AREA A-6A7FC0B1 */
 if(!target||switchingRoot||target.root===root)return;
 switchingRoot=true;
 try{
  rememberRoot();
  root=target.root;items=target.items;selected=target.selected;sequence=target.sequence;
  orderDirty=target.orderDirty;virtualRoot=target.virtualRoot;cloudVirtualId=target.root.cloudId||null;
  rootSelected=target.rootSelected;rootCollapsed=target.rootCollapsed;
  collapsed.clear();for(const id of target.collapsed)collapsed.add(id);
  nodeDB=target.nodeDB;recordDB=target.recordDB;recordWrite=target.recordWrite;nodeWrite=target.nodeWrite;
  resetBatch();rootLabel.textContent=root.name;dirty=false;
  const file=items.find(x=>x.uuid===target.activeUUID&&x.kind==='file');
  selected=null;
  if(file)await choose(file);
  else {rawMarkdown='';setName('未命名.md');setDocumentVisible(false);switchMode('edit');display();}
 }finally{switchingRoot=false;}
/* BLOCK B-46FC5B1B7B END. */}
function renderOtherRoots(){/* BLOCK B-E605760B00 START: AREA A-6A7FC0B1 */
 for(const workspace of rootWorkspaces){if(workspace.root===root)continue;
  const row=document.createElement('div');row.className='tree-node root-tree-node';
  row.style.paddingLeft='10px';row.style.cursor='pointer';
  const label=document.createElement('span');label.className='node-label';label.textContent='▸ ▣ '+workspace.root.name;
  row.append(label);row.title='切換至此 Root（操作以所選文件所屬 Root 為準）';
  row.onclick=()=>activateRoot(workspace).catch(e=>alert('Root 切換失敗：'+e.message));
  tree.append(row);
  // Show every opened Root's tree; selecting a file activates its owning Root first.
  const drawInactive=(parent,depth)=>{/* BLOCK B-BFA94A92AE START: AREA A-6A7FC0B1 */
   const children=workspace.items.filter(x=>x.parent===parent).sort((a,b)=>a.order-b.order);
   for(const x of children){
    if(explorerQuery&&!x.name.toLocaleLowerCase().includes(explorerQuery)&&!workspace.items.some(y=>y.name.toLocaleLowerCase().includes(explorerQuery)&&(()=>{/* BLOCK B-4B80143376 START: AREA A-6A7FC0B1 */let a=y.parent;while(a){if(a===x)return true;a=a.parent}return false/* BLOCK B-4B80143376 END. */})()))continue;
    const node=document.createElement('div');node.className='tree-node';node.style.paddingLeft=(10+depth*15)+'px';
    const name=document.createElement('span');name.className='node-label';name.textContent=(x.kind==='directory'?'▾ ':'▤ ')+x.name;node.append(name);
    node.onclick=async()=>{/* BLOCK B-750698DC3F START: AREA A-6A7FC0B1 */try{await activateRoot(workspace);const live=items.find(y=>y.uuid===x.uuid);if(live){if(live.kind==='file')await choose(live);else{selected=live.id;rootSelected=false;display()}}}catch(e){alert('切換文件失敗：'+e.message)}/* BLOCK B-750698DC3F END. */};
    tree.append(node);if(x.kind==='directory')drawInactive(x,depth+1);
   }
  /* BLOCK B-BFA94A92AE END. */};
  drawInactive(null,1);
 }
/* BLOCK B-E605760B00 END. */}
// AREA ROOT ORDER START: opened order, draggable root headers, touch long-press reorder.
let rootDrag=null;
function reorderRoot(source,target){/* BLOCK B-F75291C6FB START: AREA A-6A7FC0B1 */
 if(!source||!target||source===target)return;
 rememberRoot();const from=rootWorkspaces.findIndex(w=>w.root===source),to=rootWorkspaces.findIndex(w=>w.root===target);
 if(from<0||to<0)return;
 const [entry]=rootWorkspaces.splice(from,1);rootWorkspaces.splice(to,0,entry);display();
/* BLOCK B-F75291C6FB END. */}
function enableRootOrdering(){/* BLOCK B-A52A5688FA START: AREA A-6A7FC0B1 */
 const headers=[...tree.querySelectorAll('.root-tree-node')];
 for(const header of headers){
  const name=header.querySelector('.node-label')?.textContent||'';
  const workspace=rootWorkspaces.find(w=>name.includes('▣ '+w.root.name));if(!workspace)continue;
  header.draggable=true;header.title=(header.title||'')+'｜拖曳排序，觸控長按後移動';
  header.addEventListener('dragstart',e=>{/* BLOCK B-B282B0EC9C START: AREA A-6A7FC0B1 */rootDrag=workspace.root;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','bv-root-order')/* BLOCK B-B282B0EC9C END. */});
  header.addEventListener('dragover',e=>{/* BLOCK B-B238E0EEAC START: AREA A-6A7FC0B1 */if(rootDrag){e.preventDefault();header.classList.add('root-order-target')}/* BLOCK B-B238E0EEAC END. */});
  header.addEventListener('dragleave',()=>header.classList.remove('root-order-target'));
  header.addEventListener('drop',e=>{/* BLOCK B-F5F8876CBE START: AREA A-6A7FC0B1 */if(!rootDrag)return;e.preventDefault();header.classList.remove('root-order-target');reorderRoot(rootDrag,workspace.root);rootDrag=null/* BLOCK B-F5F8876CBE END. */});
  header.addEventListener('dragend',()=>{/* BLOCK B-A5A7D55063 START: AREA A-6A7FC0B1 */rootDrag=null;header.classList.remove('root-order-target')/* BLOCK B-A5A7D55063 END. */});
  let press=null,ready=false;
  header.addEventListener('touchstart',e=>{/* BLOCK B-14EA70EB51 START: AREA A-6A7FC0B1 */if(e.touches.length!==1)return;ready=false;press=setTimeout(()=>{/* BLOCK B-867316B9C2 START: AREA A-6A7FC0B1 */ready=true;header.classList.add('root-order-target')/* BLOCK B-867316B9C2 END. */},550)/* BLOCK B-14EA70EB51 END. */},{passive:true});
  header.addEventListener('touchmove',e=>{/* BLOCK B-56B4C1ECFE START: AREA A-6A7FC0B1 */if(!ready)return;const t=e.touches[0],other=document.elementFromPoint(t.clientX,t.clientY)?.closest('.root-tree-node');headers.forEach(h=>h.classList.toggle('root-order-target',h===other))/* BLOCK B-56B4C1ECFE END. */},{passive:true});
  header.addEventListener('touchend',e=>{/* BLOCK B-69DBF16437 START: AREA A-6A7FC0B1 */clearTimeout(press);if(ready){const t=e.changedTouches[0],other=document.elementFromPoint(t.clientX,t.clientY)?.closest('.root-tree-node');const target=other&&rootWorkspaces.find(w=>(other.querySelector('.node-label')?.textContent||'').includes('▣ '+w.root.name));if(target)reorderRoot(workspace.root,target.root);e.preventDefault()}ready=false;headers.forEach(h=>h.classList.remove('root-order-target'))/* BLOCK B-69DBF16437 END. */});
  header.addEventListener('touchcancel',()=>{/* BLOCK B-1EE655F4C6 START: AREA A-6A7FC0B1 */clearTimeout(press);ready=false;headers.forEach(h=>h.classList.remove('root-order-target'))/* BLOCK B-1EE655F4C6 END. */});
 }
 // Rendered active Root may be anywhere: move each Root section to its open-order position.
 const sections=[];let currentSection=null;
 for(const node of [...tree.children]){if(node.classList.contains('root-tree-node')){currentSection=[];sections.push({root:rootWorkspaces.find(w=>(node.querySelector('.node-label')?.textContent||'').includes('▣ '+w.root.name))?.root,nodes:currentSection})}if(currentSection)currentSection.push(node)}
 for(const w of rootWorkspaces){const section=sections.find(x=>x.root===w.root);if(section)for(const node of section.nodes)tree.append(node)}
/* BLOCK B-A52A5688FA END. */}
// AREA ROOT ORDER END
// AREA MULTIROOT END
async function openRootFromHandle(d){orderingActive=false;orderingParent=null;/* BLOCK B-5C29B82EFF START: AREA A-6A7FC0B1 */virtualRoot=false;cloudVirtualId=null;
 const previousSession=(()=>{/* BLOCK B-9373222183 START: AREA A-6A7FC0B1 */try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}/* BLOCK B-9373222183 END. */})();
 root=d;rootSelected=false;rootCollapsed=false;readingPositions.clear();readingRestoreToken++;readingRestoring=false;
 items=[];selected=null;sequence=0;resetBatch();collapsed.clear();await scan(d,null);await loadNodeDB();await loadOrders();await loadRecordDB();
 for(const node of items)if(node.kind==='directory')collapsed.add(node.id);
 orderDirty=false;rootLabel.textContent=d.name;rawMarkdown='';setName('未命名.md');dirty=false;setDocumentVisible(false);switchMode('edit');display();
 try{const session=previousSession;if(session?.rootName===d.name){const target=items.find(x=>x.uuid===session.fileUUID);if(target){await choose(target);if(session.mode==='view')switchMode('view',true);else{switchMode('edit',true);if(typeof session.raw==='string'&&session.raw!==rawMarkdown){sourceArea.value=session.raw;rawMarkdown=session.raw;dirty=true;refreshUnsaved()}}}}}catch(err){console.warn('Session restore',err)}
/* BLOCK B-5C29B82EFF END. */}

// Import a copy into the selected directory (or the selected file's parent).
const importPicker=document.createElement('input');importPicker.type='file';importPicker.accept='.md,.txt,.pdf';importPicker.multiple=true;importPicker.hidden=true;document.body.append(importPicker);
let importDestination=null;
function openLocalImportPicker(destination){/* BLOCK B-DEE881986C START: AREA A-6A7FC0B1 */
 if(!root)return alert('請先開啟 Root');
 importDestination=destination?.kind==='directory'?destination:destination?.parent||null;
 importPicker.value='';importPicker.click();
/* BLOCK B-DEE881986C END. */}
importPicker.addEventListener('change',async()=>{/* BLOCK B-59D503DCC0 START: AREA A-6A7FC0B1 */
 const files=[...importPicker.files];if(!files.length||!root)return;
 const parent=importDestination,dir=dirOf(parent);let added=0,errors=[];
 for(const file of files){
  if(!/\.(md|txt|pdf)$/i.test(file.name)){errors.push(file.name+'：只支援 .md、.txt、.pdf');continue}
  try{
   let name=file.name;let i=2;
   while(true){try{await dir.getFileHandle(name);const dot=file.name.lastIndexOf('.');name=file.name.slice(0,dot)+' ('+(i++)+')'+file.name.slice(dot)}catch(err){if(err.name==='NotFoundError')break;throw err}}
   const h=await dir.getFileHandle(name,{create:true});const w=await h.createWritable();await w.write(await file.arrayBuffer());await w.close();
   const x={id:++sequence,uuid:uuid(),name,handle:h,parent,kind:'file',order:sequence,buffer:null};items.push(x);nodeDB.nodes[path(x)]=x.uuid;added++;
  }catch(err){errors.push(file.name+'：'+err.message)}
 }
 await flushNodeDB();orderDirty=true;await saveOrders();display();toast('已導入 '+added+' 個文件');if(errors.length)alert(errors.join('\n'));
/* BLOCK B-59D503DCC0 END. */});
// Standards-compliant ZIP (stored entries); no network dependency.
function zipCRC(bytes){/* BLOCK B-45CF103403 START: AREA A-6A7FC0B1 */let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0/* BLOCK B-45CF103403 END. */}
function makeZip(entries){/* BLOCK B-6E063F9D3D START: AREA A-6A7FC0B1 */
 const enc=new TextEncoder(),parts=[],central=[];let offset=0;
 const u16=(v)=>[v&255,(v>>>8)&255],u32=(v)=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 for(const entry of entries){const name=enc.encode(entry.name),data=entry.data,crc=zipCRC(data),flags=0x800;
  const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);parts.push(local,data);
  central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(entry.name.endsWith('/')?16:0),...u32(offset),...name]));offset+=local.length+data.length;
 }
 const centralSize=central.reduce((n,x)=>n+x.length,0);const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralSize),...u32(offset),...u16(0)]);
 return new Blob([...parts,...central,end],{type:'application/zip'});
/* BLOCK B-6E063F9D3D END. */}
async function exportNode(node){/* BLOCK B-81CC6C25B6 START: AREA A-6A7FC0B1 */
 if(!root)return;const entries=[];const base=node?node.name:root.name;
 async function collect(handle,name){/* BLOCK B-078D27FE78 START: AREA A-6A7FC0B1 */if(handle.kind==='file'){entries.push({name,data:new Uint8Array(await(await handle.getFile()).arrayBuffer())});return}
  entries.push({name:name+'/',data:new Uint8Array()});for await(const [child,h] of handle.entries())await collect(h,name+'/'+child);
 /* BLOCK B-078D27FE78 END. */}
 try{
 if(!virtualRoot&&orderDirty)await saveOrders();
 await collect(node?.handle||root,base);
 if(virtualRoot){entries.push({name:base+'/'+ORDER_FILE,data:orderEntry().data})}
 if(entries.length>65000)throw Error('ZIP 項目數量過多');const blob=makeZip(entries);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=base+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('已導出 '+base+'.zip');}catch(err){alert('導出失敗：'+err.message)}
/* BLOCK B-81CC6C25B6 END. */}
function rootMenu(left,top){/* BLOCK B-29EB4A4697 START: AREA A-6A7FC0B1 */
 const m=document.querySelector('#context-menu');m.replaceChildren();
 for(const [label,fn] of [['新增 Fold',()=>create('directory',true)],['新增 File',()=>create('file',true)],['重新命名 Root',renameRoot],['調整節點',()=>adjustNodes(null)],['導入文件',()=>openLocalImportPicker(null)],['導出文件（ZIP）',()=>exportNode(null)],['儲存 Root',saveAll],['關閉 Root',closeRoot]]){
  const b=document.createElement('button');b.textContent=label;b.onclick=()=>{/* BLOCK B-D59476608A START: AREA A-6A7FC0B1 */m.hidden=true;Promise.resolve().then(fn).catch(e=>alert(e.message))/* BLOCK B-D59476608A END. */};m.append(b);
 }positionMenu(m,left,top);
/* BLOCK B-29EB4A4697 END. */}
const explorerSearchInput=document.querySelector('#explorer-search-input');
const explorerSearchStatus=document.querySelector('#explorer-search-status');
const explorerSearchClear=document.querySelector('#explorer-search-clear');
let explorerQuery='';
explorerSearchInput.addEventListener('input',()=>{/* BLOCK B-C9B5A8C634 START: AREA A-6A7FC0B1 */explorerQuery=explorerSearchInput.value.trim().toLocaleLowerCase();display()/* BLOCK B-C9B5A8C634 END. */});
explorerSearchClear.addEventListener('click',()=>{/* BLOCK B-9669E80AD5 START: AREA A-6A7FC0B1 */explorerSearchInput.value='';explorerQuery='';display();explorerSearchInput.focus()/* BLOCK B-9669E80AD5 END. */});
function display(){/* BLOCK B-5CDD2C831E START: AREA A-6A7FC0B1 */cloudFolderButton.hidden=!(cloudVirtualId&&root?.cloudId===cloudVirtualId);tree.replaceChildren();
 explorerSearchClear.hidden=!explorerQuery;
 if(!root){explorerSearchStatus.textContent='';renderOtherRoots();enableRootOrdering();return;}
 const matches=new Set();let directMatches=0;
 if(explorerQuery){for(const node of items){if(!node.name.toLocaleLowerCase().includes(explorerQuery))continue;directMatches++;matches.add(node.id);let ancestor=node.parent;while(ancestor){matches.add(ancestor.id);ancestor=ancestor.parent}}}
 explorerSearchStatus.textContent=explorerQuery?`符合 ${directMatches} 個項目` : '';

 const rootRow=document.createElement('div');rootRow.className='tree-node root-tree-node';rootRow.style.paddingLeft='10px';rootRow.classList.toggle('selected',rootSelected);
 const rootTitle=document.createElement('span');rootTitle.className='node-label';rootTitle.textContent=(rootCollapsed?'▸ ':'▾ ')+ '▣ '+root.name;rootRow.append(rootTitle);
 const rootEdit=document.createElement('button');rootEdit.type='button';rootEdit.textContent='✎';rootEdit.title='直接重新命名 Root';rootEdit.setAttribute('aria-label','重新命名 Root');rootEdit.style.cssText='margin-left:auto;padding:2px 7px;cursor:pointer';
 rootEdit.onclick=e=>{e.preventDefault();e.stopPropagation();const input=document.createElement('input');input.type='text';input.value=root.name;input.maxLength=200;input.setAttribute('aria-label','Root 新名稱');input.style.cssText='min-width:0;flex:1;margin:0 5px';rootTitle.replaceWith(input);rootEdit.hidden=true;input.focus();input.select();let finished=false;const finish=async(save)=>{if(finished)return;finished=true;const value=input.value.trim();if(save&&value&&value!==root.name)await renameRoot(value);display()};input.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();finish(true)}else if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();finish(false)}});input.addEventListener('blur',()=>finish(true));input.onclick=ev=>ev.stopPropagation()};rootRow.append(rootEdit);
 rootRow.onclick=e=>{/* BLOCK B-7C4CFA0ABF START: AREA A-6A7FC0B1 */rootSelected=true;selected=null;if(e.detail===2)rootCollapsed=!rootCollapsed;display()/* BLOCK B-7C4CFA0ABF END. */};
 rootRow.oncontextmenu=e=>{/* BLOCK B-E26E92CE06 START: AREA A-6A7FC0B1 */e.preventDefault();e.stopPropagation();rootMenu(e.clientX,e.clientY)/* BLOCK B-E26E92CE06 END. */};
 let timer;rootRow.addEventListener('touchstart',e=>{/* BLOCK B-280DA73CD4 START: AREA A-6A7FC0B1 */if(e.touches.length!==1)return;const x=e.touches[0].clientX,y=e.touches[0].clientY;timer=setTimeout(()=>rootMenu(x,y),550)/* BLOCK B-280DA73CD4 END. */},{passive:true});
 for(const ev of ['touchend','touchcancel','touchmove'])rootRow.addEventListener(ev,()=>clearTimeout(timer),{passive:true});
 tree.append(rootRow);
 const draw=(parent,level)=>{/* BLOCK B-FBDBB57E01 START: AREA A-6A7FC0B1 */siblings(parent).forEach((x,i)=>{/* BLOCK B-C513D90AE9 START: AREA A-6A7FC0B1 */if(explorerQuery&&!matches.has(x.id))return;const row=document.createElement('div');row.className='tree-node'+(selected===x.id?' selected':'');row.style.paddingLeft=(10+level*15)+'px';row.draggable=true;row.dataset.id=x.id;
const label=document.createElement('span');label.className='node-label';label.textContent=(x.kind==='directory'?(collapsed.has(x.id)?'▸ ':'▾ '):'▤ ')+x.name;const rank=document.createElement('small');rank.textContent=String(i+1);row.append(label,rank);
if(orderingActive&&orderingParent===x.parent){
 const up=document.createElement('button'),down=document.createElement('button');
 up.type=down.type='button';up.textContent='↑';down.textContent='↓';
 up.title='節點上移';down.title='節點下移';
 up.style.cssText=down.style.cssText='padding:1px 5px;cursor:pointer';
 up.onclick=e=>{e.preventDefault();e.stopPropagation();shiftNode(x,-1).catch(err=>alert(err.message))};
 down.onclick=e=>{e.preventDefault();e.stopPropagation();shiftNode(x,1).catch(err=>alert(err.message))};
 row.append(up,down);
}if(batchMode){const cb=document.createElement('input');cb.type='checkbox';cb.className='node-check';cb.checked=checkedIds.has(x.id);cb.setAttribute('aria-label','選取 '+x.name);cb.onclick=e=>e.stopPropagation();cb.onchange=()=>{/* BLOCK B-D5CF445255 START: AREA A-6A7FC0B1 */const on=cb.checked;for(const node of items){if(node===x||x.kind==='directory'&&isChild(node,x)){if(on)checkedIds.add(node.id);else checkedIds.delete(node.id)}}display()/* BLOCK B-D5CF445255 END. */};row.append(cb)}row.onclick=()=>{/* BLOCK B-CBC58DCFED START: AREA A-6A7FC0B1 */if(x.kind==='directory'){selected=x.id;rootSelected=false;if(!collapsed.delete(x.id))collapsed.add(x.id);display();}else choose(x)/* BLOCK B-CBC58DCFED END. */};row.oncontextmenu=e=>{/* BLOCK B-965BA24F07 START: AREA A-6A7FC0B1 */e.preventDefault();e.stopPropagation();selected=x.id;display();if(batchMode&&checkedIds.size)operateMenu(e.clientX,e.clientY);else menu(x,e.clientX,e.clientY)/* BLOCK B-965BA24F07 END. */};
// Long-press on mobile opens the same menu as desktop right-click.
let pressTimer=null,startX=0,startY=0,suppressClick=false;
row.addEventListener('touchstart',e=>{/* BLOCK B-9B02BC130C START: AREA A-6A7FC0B1 */
 if(e.touches.length!==1)return;
 startX=e.touches[0].clientX;startY=e.touches[0].clientY;
 clearTimeout(pressTimer);
 pressTimer=setTimeout(()=>{/* BLOCK B-C7155B6F2F START: AREA A-6A7FC0B1 */
  pressTimer=null;suppressClick=true;if(orderingActive&&orderingParent===x.parent){row.dataset.sortReady='1';row.style.opacity='0.65';return;}selected=x.id;display();if(batchMode&&checkedIds.size)operateMenu(startX,startY);else menu(x,startX,startY);
 /* BLOCK B-C7155B6F2F END. */},550);
/* BLOCK B-9B02BC130C END. */},{passive:true});
row.addEventListener('touchmove',e=>{/* BLOCK B-249E9695AE START: AREA A-6A7FC0B1 */
 if(!e.touches.length||Math.abs(e.touches[0].clientX-startX)>12||Math.abs(e.touches[0].clientY-startY)>12){clearTimeout(pressTimer);pressTimer=null}
/* BLOCK B-249E9695AE END. */},{passive:true});
row.addEventListener('touchend',e=>{/* BLOCK B-368BCCF08A START: AREA A-6A7FC0B1 */clearTimeout(pressTimer);pressTimer=null;
 if(row.dataset.sortReady==='1'){
   const t=e.changedTouches[0],hit=document.elementFromPoint(t.clientX,t.clientY)?.closest('.tree-node[data-id]');
   const target=hit&&items.find(n=>n.id===Number(hit.dataset.id));
   if(target&&reorderSibling(x,target))persistOrderChange().then(display).catch(err=>alert(err.message));
   else display();
 }/* BLOCK B-368BCCF08A END. */},{passive:true});
row.addEventListener('touchcancel',()=>{/* BLOCK B-0904BE65F4 START: AREA A-6A7FC0B1 */clearTimeout(pressTimer);pressTimer=null/* BLOCK B-0904BE65F4 END. */},{passive:true});
row.addEventListener('click',e=>{/* BLOCK B-B1F3C84D21 START: AREA A-6A7FC0B1 */if(suppressClick){e.stopImmediatePropagation();e.preventDefault();suppressClick=false}/* BLOCK B-B1F3C84D21 END. */},true);
row.ondragstart=e=>{/* BLOCK B-4E8B497299 START: AREA A-6A7FC0B1 */e.dataTransfer.setData('text/plain',String(x.id));e.dataTransfer.effectAllowed='move'/* BLOCK B-4E8B497299 END. */};row.ondragover=e=>{/* BLOCK B-2880378987 START: AREA A-6A7FC0B1 */e.preventDefault()/* BLOCK B-2880378987 END. */};row.ondrop=async e=>{/* BLOCK B-17747FA877 START: AREA A-6A7FC0B1 */e.preventDefault();const moving=items.find(y=>y.id===Number(e.dataTransfer.getData('text/plain')));if(moving){if(orderingActive&&orderingParent===x.parent&&reorderSibling(moving,x)){await persistOrderChange();display()}else if(orderingActive&&orderingParent===x.parent){toast('只能調整同一層節點')}else await move(moving,x,e.shiftKey)}/* BLOCK B-17747FA877 END. */};
tree.append(row);if(x.kind==='directory'&&(explorerQuery||!collapsed.has(x.id)))draw(x,level+1)/* BLOCK B-C513D90AE9 END. */})/* BLOCK B-FBDBB57E01 END. */};if(explorerQuery||!rootCollapsed)draw(null,1);renderOtherRoots();enableRootOrdering()/* BLOCK B-5CDD2C831E END. */}
// v2.2.12: Remember the reading position independently for each Explorer file.
// The workspace main element is the actual scroll container (not window).
const readingPositions=new Map();
let readingRestoreToken=0;
let readingRestoring=false;
function readingKey(x){/* BLOCK B-58255ABDCE START: AREA A-6A7FC0B1 */return x?path(x):null/* BLOCK B-58255ABDCE END. */}
function rememberReadingPosition(){/* BLOCK B-5580F8E186 START: AREA A-6A7FC0B1 */
 const x=current();
 if(x?.kind==='file' && sourceArea.style.display==='none')
  readingPositions.set(readingKey(x),main.scrollTop);
/* BLOCK B-5580F8E186 END. */}
function restoreReadingPosition(x){/* BLOCK B-7E87888BD5 START: AREA A-6A7FC0B1 */
 const token=++readingRestoreToken;
 readingRestoring=true;
 const target=readingPositions.get(readingKey(x))??0;
 // Wait until the newly selected document has been rendered and laid out.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{/* BLOCK B-8FAC6FC3B9 START: AREA A-6A7FC0B1 */
  if(token!==readingRestoreToken || selected!==x.id || sourceArea.style.display!=='none')return;
  main.scrollTop=target;
  requestAnimationFrame(()=>{/* BLOCK B-432A977287 START: AREA A-6A7FC0B1 */if(token===readingRestoreToken)readingRestoring=false/* BLOCK B-432A977287 END. */});
 /* BLOCK B-8FAC6FC3B9 END. */}));
/* BLOCK B-7E87888BD5 END. */}
main.addEventListener('scroll',()=>{/* BLOCK B-8DA52281B0 START: AREA A-6A7FC0B1 */
 // Do not overwrite a stored position while the document is being replaced.
 if(readingRestoring)return;
 rememberReadingPosition();
/* BLOCK B-8DA52281B0 END. */},{passive:true});
async function choose(x){/* BLOCK B-C09DBAE911 START: AREA A-6A7FC0B1 */
 window.BVPdfViewer?.hide();sourceButton.hidden=false;
 window.BVShowPage?.("editor");
 if(x.kind==='directory'){selected=x.id;rootSelected=false;display();return}
 const wasViewing=sourceArea.style.display==='none';
 rememberReadingPosition();
 if(dirty&&current()&&current().kind==='file')current().buffer=wasViewing?rawMarkdown:sourceArea.value;
 selected=x.id;rootSelected=false;
 try{
  const f=await x.handle.getFile();
  if(isPdfFile(x.name)){
   rawMarkdown='';setName(x.name);handle=x.handle;dirty=false;
   setDocumentVisible(true);
   sourceArea.style.display='none';editor.style.display='none';
   sourceButton.hidden=true;
   await window.BVPdfViewer.show(f);
   toast('唯讀 PDF：'+path(x));display();return;
  }
  sourceButton.hidden=false;
  rawMarkdown=x.buffer??await f.text();setName(x.name);handle=x.handle;
  dirty=x.buffer!==null;setDocumentVisible(true);switchMode(wasViewing?'view':'edit',true);
  if(wasViewing)restoreReadingPosition(x);
  else {readingRestoring=false;main.scrollTop=0;}
  toast('已開啟 '+path(x));display();window.BVActivateFileRecords?.(x.uuid);
 }catch(e){alert('開啟失敗：'+e.message)}
/* BLOCK B-C09DBAE911 END. */}
async function saveAll(){/* BLOCK B-19C714B4C6 START: AREA A-6A7FC0B1 */if(!root)return;if(virtualRoot)return saveVirtual();const x=current();if(x&&dirty)x.buffer=rawMarkdown;let n=0;try{for(const f of items.filter(y=>y.kind==='file'&&y.buffer!==null)){const w=await f.handle.createWritable();await w.write(f.buffer);await w.close();f.buffer=null;n++}await saveOrders();await window.BVFlushFileRecords?.();await flushNodeDB();await flushRecordDB();dirty=false;refreshUnsaved();toast('Root 已儲存：'+n+' 個修改文件，節點順序已記錄')}catch(e){alert('儲存失敗：'+e.message)}/* BLOCK B-19C714B4C6 END. */}
async function openRoot(){/* BLOCK B-1EC982FAE8 START: AREA A-6A7FC0B1 */
 if(!window.showDirectoryPicker){alert('此瀏覽器不支援本地資料夾存取。請使用支援 File System Access API 的桌面版 Chrome/Edge，並以 HTTPS 或 localhost 開啟。');return}
 try{
  const d=await showDirectoryPicker({mode:'readwrite'});
  rememberRoot();
  for(const w of rootWorkspaces){if(w.root===d||typeof w.root.isSameEntry==='function'&&await w.root.isSameEntry(d)){await activateRoot(w);return}}
  await openRootFromHandle(d);rememberRoot();toast('已加入 Root '+d.name);
 }catch(e){if(e.name!=='AbortError')alert('資料夾開啟失敗：'+e.message)}
/* BLOCK B-1EC982FAE8 END. */}
async function closeRoot(){/* BLOCK B-A11F0A0A3D START: AREA A-6A7FC0B1 */
 window.BVPdfViewer?.hide();sourceButton.hidden=false;if(!root)return;
 if((dirty||orderDirty||items.some(x=>x.buffer!==null))&&!confirm('此 Root 有未儲存修改，仍要關閉？'))return;
 const old=root;const next=rootWorkspaces.find(w=>w.root!==old);
 rootWorkspaces.splice(rootWorkspaces.findIndex(w=>w.root===old),1);
 root=null;virtualRoot=false;cloudVirtualId=null;selected=null;items=[];sequence=0;orderDirty=false;
 rootSelected=false;rootCollapsed=false;collapsed.clear();resetBatch();dirty=false;
 rawMarkdown='';setName('未命名.md');setDocumentVisible(false);
 if(next)await activateRoot(next);else{rootLabel.textContent='尚未選取 Root';switchMode('edit');display()}
/* BLOCK B-A11F0A0A3D END. */}
function dirOf(p){/* BLOCK B-D9663A5614 START: AREA A-6A7FC0B1 */return p?p.handle:root/* BLOCK B-D9663A5614 END. */}
function normalizeNewFileName(name){/* BLOCK B-9277220E37 START: AREA A-6A7FC0B1 */
 const trimmed=name.trim();
 return /\.[^./\\]+$/.test(trimmed)?trimmed:trimmed+'.md';
/* BLOCK B-9277220E37 END. */}
async function createCloudNode(kind,forceRoot=false){/* BLOCK B-D977979554 START: AREA A-6A7FC0B1 */
 if(!cloudVirtualId||root?.cloudId!==cloudVirtualId)throw Error('目前未選取 Cloud Root');
 const active=current();
 const parent=(forceRoot||rootSelected)?null:(active?.kind==='directory'?active:active?.parent||null);
 let name=await inlineName('Cloud Root 新增 '+(kind==='file'?'File':'Fold'),kind==='file'?'新文件.md':'新資料夾');
 if(!name)return;
 if(kind==='file')name=normalizeNewFileName(name);
 if(!name||name==='.'||name==='..'||/[\\/\x00-\x1f]/.test(name))throw Error('名稱無效');
 if(siblings(parent).some(n=>n.name===name))throw Error('同一層已存在相同名稱的 File/Fold');
 // Preserve the unsaved editor buffer before changing the selected node.
 if(active?.kind==='file'&&dirty)active.buffer=sourceArea.style.display==='none'?rawMarkdown:sourceArea.value;
 const handle=kind==='file'?memoryFile(name,new Uint8Array(0)):{kind:'directory',name};
 const node={id:++sequence,uuid:uuid(),name,handle,parent,kind,order:sequence,buffer:null};
 if(kind==='directory')node.handle=cloudDir(node);items.push(node);nodeDB.nodes[path(node)]=node.uuid;
 // Persist the full Cloud Root snapshot in IndexedDB; no local filesystem writes.
 const entries=[];
 for(const item of items.filter(n=>n.kind==='directory'))entries.push({path:path(item)+'/',dir:true});
 for(const item of items.filter(n=>n.kind==='file')){
  const bytes=item.buffer!==null?new TextEncoder().encode(item.buffer):item.handle.bytes();
  entries.push({path:path(item),data:bytes});
 }
 await cloudWrite('bv378-root-'+cloudVirtualId,{id:cloudVirtualId,name:root.name,entries,updatedAt:Date.now()});
 orderDirty=true;
 if(parent)collapsed.delete(parent.id);
 display();
 if(kind==='file')await choose(node);
 else {selected=node.id;rootSelected=false;display()}
 rememberRoot();toast('Cloud Root 已新增 '+(kind==='file'?'File':'Fold')+'：'+path(node)+'（已存 IndexedDB，尚未 Commit）');
/* BLOCK B-D977979554 END. */}
async function create(kind,forceRoot=false){/* BLOCK B-3DAFFD6699 START: AREA A-6A7FC0B1 */if(virtualRoot){if(cloudVirtualId&&root?.cloudId===cloudVirtualId){try{await createCloudNode(kind,forceRoot)}catch(e){alert('新增失敗：'+e.message)}return}return alert('單一文件 Root 不允許新增子 Fold/File')};if(!root){if(kind!=='directory')return alert('請先選取本地文件夾');const nm=await inlineName('建立 Root 文件夾','MyNotes');if(!nm)return;if(/[\\/]/.test(nm)||nm==='.'||nm==='..')return alert('名稱無效');if(!window.showDirectoryPicker)return alert('瀏覽器不支援本地資料夾選取');try{const parent=await showDirectoryPicker({mode:'readwrite'});root=await parent.getDirectoryHandle(nm,{create:true});nodeDB={version:1,rootId:uuid(),nodes:{}};await flushNodeDB();rootCollapsed=false;items=[];selected=null;sequence=0;collapsed.clear();rootLabel.textContent=root.name;orderDirty=false;setDocumentVisible(false);display();toast('已建立 Root '+nm)}catch(err){if(err.name!=='AbortError')alert('建立 Root 失敗：'+err.message)}return;}const p=(forceRoot||rootSelected)?null:(current()?.kind==='directory'?current():current()?.parent||null);let nm=await inlineName('新增 '+kind,kind==='file'?'新文件.md':'新資料夾');if(!nm)return;if(kind==='file')nm=normalizeNewFileName(nm);if(nm.includes('/')||nm.includes('\\')||nm==='.'||nm==='..')return alert('名稱無效');try{const h=kind==='file'?await dirOf(p).getFileHandle(nm,{create:true}):await dirOf(p).getDirectoryHandle(nm,{create:true});const x={id:++sequence,uuid:uuid(),name:nm,handle:h,parent:p,kind,order:sequence,buffer:kind==='file'?'':null};items.push(x);nodeDB.nodes[path(x)]=x.uuid;await flushNodeDB();orderDirty=true;display();if(kind==='file')await choose(x)}catch(e){alert(e.message)}/* BLOCK B-3DAFFD6699 END. */}
function inlineName(title,value){/* BLOCK B-E75B84D613 START: AREA A-6A7FC0B1 */return new Promise(resolve=>{/* BLOCK B-34F585E353 START: AREA A-6A7FC0B1 */const box=document.querySelector('#inline-name');box.replaceChildren();const lab=document.createElement('label');lab.textContent=title;const inp=document.createElement('input');inp.type='text';inp.name='bv_explorer_node_rename';inp.autocomplete='off';inp.setAttribute('data-bv-no-autofill','1');inp.value=value;const ok=document.createElement('button');ok.textContent='確認';const cancel=document.createElement('button');cancel.textContent='取消';box.append(lab,inp,ok,cancel);box.hidden=false;inp.focus();inp.select();const done=v=>{/* BLOCK B-B6FFC15AA9 START: AREA A-6A7FC0B1 */box.hidden=true;resolve(v)/* BLOCK B-B6FFC15AA9 END. */};ok.onclick=()=>done(inp.value.trim());cancel.onclick=()=>done(null);inp.onkeydown=e=>{/* BLOCK B-16BC483B49 START: AREA A-6A7FC0B1 */if(e.key==='Enter')done(inp.value.trim());if(e.key==='Escape')done(null)/* BLOCK B-16BC483B49 END. */}/* BLOCK B-34F585E353 END. */})/* BLOCK B-E75B84D613 END. */}
async function copyNode(x,target,name){/* BLOCK B-5BECC5E944 START: AREA A-6A7FC0B1 */
 if(x.kind==='file'){
  const h=await target.getFileHandle(name,{create:true});
  const w=await h.createWritable();
  try{await w.write(x.buffer??await(await x.handle.getFile()).arrayBuffer());await w.close()}catch(e){try{await w.abort()}catch{}throw e}
  return h;
 }
 const h=await target.getDirectoryHandle(name,{create:true});
 for(const c of siblings(x))await copyNode(c,h,c.name);
 return h;
/* BLOCK B-5BECC5E944 END. */}
function isChild(y,x){/* BLOCK B-F7BEC6FA05 START: AREA A-6A7FC0B1 */for(let p=y.parent;p;p=p.parent)if(p===x)return true;return false/* BLOCK B-F7BEC6FA05 END. */}
// A directory copy creates fresh FileSystemHandles for all descendants.
// Rebind them before deleting the source; otherwise future operations use stale handles.
async function rebindDescendants(dirNode){/* BLOCK B-93163E0358 START: AREA A-6A7FC0B1 */
 for(const child of siblings(dirNode)){
  child.handle=child.kind==='directory'
   ?await dirNode.handle.getDirectoryHandle(child.name)
   :await dirNode.handle.getFileHandle(child.name);
  if(child.kind==='directory')await rebindDescendants(child);
 }
/* BLOCK B-93163E0358 END. */}
async function cloudRemove(x){/* BLOCK B-A5A0BD81B7 START: AREA A-6A7FC0B1 */
 const removed=[x,...items.filter(n=>isChild(n,x))];
 for(const n of removed){delete nodeDB.nodes[path(n)];delete recordDB.files[n.uuid]}
 items=items.filter(n=>!removed.includes(n));
 if(removed.some(n=>n.id===selected)){selected=null;setDocumentVisible(false)}
 orderDirty=true;display();queueCloudSave();
/* BLOCK B-A5A0BD81B7 END. */}
async function removeNode(x){/* BLOCK B-C6DA3CBC19 START: AREA A-6A7FC0B1 */
 if(cloudVirtualId&&root?.cloudId===cloudVirtualId)return cloudRemove(x);
 // Remove the actual entry from its parent, never by interpreting a file as a folder.
 const parent=dirOf(x.parent);
 if(!parent)throw Error('找不到資料夾的父層');
 const removed=[x,...items.filter(y=>isChild(y,x))];
 await parent.removeEntry(x.name,{recursive:x.kind==='directory'});
 for(const node of removed){delete nodeDB.nodes[path(node)];delete recordDB.files[node.uuid]}
 await flushNodeDB();await flushRecordDB();
 items=items.filter(y=>y!==x&&!isChild(y,x));
 for(const id of [...checkedIds])if(!items.some(y=>y.id===id))checkedIds.delete(id);
 if(selected&&!items.some(y=>y.id===selected)){
  selected=null;handle=null;rawMarkdown='';setName('未命名.md');setDocumentVisible(false);switchMode('edit');
 }
 orderDirty=true;display();queueCloudSave();
/* BLOCK B-C6DA3CBC19 END. */}
async function rename(x){/* BLOCK B-D50E61107F START: AREA A-6A7FC0B1 */
 if(cloudVirtualId&&root?.cloudId===cloudVirtualId){const n=await inlineName('重新命名',x.name);if(!n||n===x.name)return;if(n==='.'||n==='..'||/[\\/\x00-\x1f]/.test(n)||siblings(x.parent).some(y=>y!==x&&y.name===n))return alert('名稱無效或已存在');
 const oldPaths=new Map([x,...items.filter(y=>isChild(y,x))].map(y=>[y,path(y)]));x.name=n;if(x.kind==='file')x.handle=memoryFile(n,x.buffer!==null?new TextEncoder().encode(x.buffer):x.handle.bytes());
 for(const [y,old] of oldPaths){delete nodeDB.nodes[old];nodeDB.nodes[path(y)]=y.uuid}
 if(selected===x.id)setName(n);orderDirty=true;display();queueCloudSave();return}

 const n=await inlineName('重新命名',x.name);
 if(!n||n===x.name)return;
 try{
  if(/[\\/]/.test(n)||n==='.'||n==='..')throw Error('名稱無效');
  const parent=dirOf(x.parent);
  // Reject collisions instead of overwriting an existing file/folder.
  for await(const [existing] of parent.entries())if(existing===n)throw Error('目標名稱已存在');
  const oldName=x.name;
  await window.BVFlushFileRecords?.();const previous=captureRecordPaths(x);
  const h=await copyNode(x,parent,n);
  await parent.removeEntry(oldName,{recursive:true});
  x.name=n;x.handle=h;
  if(x.kind==='directory')await rebindDescendants(x);
  await relocateRecords(previous);
  if(selected===x.id){setName(n);if(x.kind==='file')handle=h}
  orderDirty=true;display();queueCloudSave();
 }catch(e){alert('重新命名失敗：'+e.message)}
/* BLOCK B-D50E61107F END. */}
async function move(x,target,after=false){/* BLOCK B-2779ACA58E START: AREA A-6A7FC0B1 */
 if(cloudVirtualId&&root?.cloudId===cloudVirtualId){if(!x||!target||x===target||isChild(target,x))return;const p=target.kind==='directory'&&!after?target:target.parent;
 if(siblings(p).some(y=>y!==x&&y.name===x.name))return alert('目的資料夾已有同名項目');
 const oldPaths=new Map([x,...items.filter(y=>isChild(y,x))].map(y=>[y,path(y)]));x.parent=p;
 for(const [y,old] of oldPaths){delete nodeDB.nodes[old];nodeDB.nodes[path(y)]=y.uuid}
 orderDirty=true;display();queueCloudSave();return}

 if(!x||!target||x===target||isChild(target,x))return;
 const p=target.kind==='directory'&&!after?target:target.parent;
 if(x.parent===p){
  // Moving onto its own parent is a no-op, not a reordering operation.
  if(target===p)return;
  const arr=siblings(p).filter(y=>y!==x);
  const at=arr.indexOf(target);
  arr.splice(at<0?arr.length:at+(after?1:0),0,x);
  arr.forEach((y,i)=>y.order=i+1);
  orderDirty=true;display();queueCloudSave();return;
 }
 try{
  const dest=dirOf(p);
  for await(const [existing] of dest.entries())if(existing===x.name)throw Error('目標位置已有同名項目：'+x.name);
  const source=dirOf(x.parent);
  await window.BVFlushFileRecords?.();const previous=captureRecordPaths(x);
  const h=await copyNode(x,dest,x.name);
  await source.removeEntry(x.name,{recursive:true});
  x.parent=p;x.handle=h;
  if(x.kind==='directory')await rebindDescendants(x);
  await relocateRecords(previous);
  if(selected===x.id&&x.kind==='file')handle=h;
  orderDirty=true;display();queueCloudSave();toast('已移動 '+x.name);
 }catch(e){alert('移動失敗：'+e.message)}
/* BLOCK B-2779ACA58E END. */}
async function moveWithPicker(x){/* BLOCK B-F5B1E0B8A7 START: AREA A-6A7FC0B1 */
 const candidates=[{name:'Root / '+root.name,node:null},...items.filter(y=>y.kind==='directory'&&y!==x&&!isChild(y,x)).map(y=>({name:path(y),node:y}))].filter(y=>y.node!==x.parent);
 if(!candidates.length)return alert('沒有其他可移動的位置');
 const options=candidates.map((c,i)=>`${i+1}. ${c.name}`).join('\n');
 const input=prompt('移動「'+x.name+'」至哪個資料夾？輸入編號：\n'+options);
 if(input===null)return;
 const index=Number(input)-1;
 if(!Number.isInteger(index)||index<0||index>=candidates.length)return alert('編號無效');
 const dest=candidates[index].node;
 if(dest===null){
  // Use a sibling root node to route the existing move logic.
  const peer=siblings(null).find(y=>y!==x);
  if(peer)await move(x,peer,true);
  else if(x.parent!==null){
   // Explicit move-to-root without requiring an existing sibling.
   try{
    for await(const [name] of root.entries())if(name===x.name)throw Error('Root 已有同名項目');
    await window.BVFlushFileRecords?.();const previous=captureRecordPaths(x);const oldParent=dirOf(x.parent);const h=await copyNode(x,root,x.name);
    await oldParent.removeEntry(x.name,{recursive:true});x.parent=null;x.handle=h;
    if(x.kind==='directory')await rebindDescendants(x);
    await relocateRecords(previous);
    if(selected===x.id&&x.kind==='file')handle=h;
    orderDirty=true;display();queueCloudSave();toast('已移動至 Root');
   }catch(e){alert('移動失敗：'+e.message)}
  }
 }else await move(x,dest,false);
/* BLOCK B-F5B1E0B8A7 END. */}
function targets(){/* BLOCK B-E2B588A48D START: AREA A-6A7FC0B1 */const ids=batchMode&&checkedIds.size?[...checkedIds]:selected?[selected]:[];const nodes=ids.map(id=>items.find(x=>x.id===id)).filter(Boolean);return nodes.filter(x=>!nodes.some(y=>y!==x&&y.kind==='directory'&&isChild(x,y)));/* BLOCK B-E2B588A48D END. */}
function resetBatch(){/* BLOCK B-D3B94F62B8 START: AREA A-6A7FC0B1 */batchMode=false;checkedIds.clear();display()/* BLOCK B-D3B94F62B8 END. */}
async function deleteTargets(){/* BLOCK B-CCF464CA2B START: AREA A-6A7FC0B1 */const nodes=targets();if(!nodes.length)return alert('請先選取文件或資料夾');if(!confirm('確定刪除 '+nodes.length+' 個項目及其子項目？此操作無法復原。'))return;let errors=[];for(const x of nodes){try{await removeNode(x)}catch(e){errors.push(x.name+'：'+e.message)}}if(errors.length)alert('部分刪除失敗：\n'+errors.join('\n'));else toast('已刪除 '+nodes.length+' 個項目');resetBatch()/* BLOCK B-CCF464CA2B END. */}
function clipTargets(cut){/* BLOCK B-B86D2BA43F START: AREA A-6A7FC0B1 */const nodes=targets();if(!nodes.length)return alert('請先選取文件或資料夾');clipboard={nodes:nodes.map(x=>({node:x,name:x.name,kind:x.kind})),cut};toast((cut?'已剪下 ':'已複製 ')+nodes.length+' 個項目，請選擇目的資料夾後貼上')/* BLOCK B-B86D2BA43F END. */}
async function pasteTargets(){/* BLOCK B-409DBBEDB2 START: AREA A-6A7FC0B1 */if(cloudVirtualId&&root?.cloudId===cloudVirtualId){if(!clipboard?.nodes?.length)return alert('剪貼簿沒有文件');const active=current(),parent=active?.kind==='directory'?active:active?.parent||null;let count=0;
 for(const {node:x} of clipboard.nodes){if(!items.includes(x)||x===parent||parent&&isChild(parent,x))continue;if(siblings(parent).some(y=>y!==x&&y.name===x.name))continue;
 if(clipboard.cut){const oldPaths=new Map([x,...items.filter(y=>isChild(y,x))].map(y=>[y,path(y)]));x.parent=parent;for(const [y,old] of oldPaths){delete nodeDB.nodes[old];nodeDB.nodes[path(y)]=y.uuid}}
 else{const clone=(original,p)=>{/* BLOCK B-CDEEE1D8B6 START: AREA A-6A7FC0B1 */const n={id:++sequence,uuid:uuid(),name:original.name,kind:original.kind,parent:p,order:sequence,buffer:original.buffer};n.handle=n.kind==='directory'?cloudDir(n):memoryFile(n.name,original.buffer!==null?new TextEncoder().encode(original.buffer):original.handle.bytes());items.push(n);nodeDB.nodes[path(n)]=n.uuid;if(n.kind==='directory')for(const c of siblings(original))clone(c,n)/* BLOCK B-CDEEE1D8B6 END. */};clone(x,parent)}count++}
 if(clipboard.cut)clipboard=null;orderDirty=true;display();queueCloudSave();toast('已貼上 '+count+' 個項目');return}
if(!root||!clipboard?.nodes.length)return alert('剪貼簿沒有可貼上的項目');const cur=current();const destNode=cur?.kind==='directory'?cur:cur?.parent||null;const dest=dirOf(destNode);if(!dest)return alert('請先選擇 Root');let failures=[];const done=[];for(const entry of clipboard.nodes){const x=entry.node;if(!items.includes(x)){failures.push(entry.name+'：來源已不存在');continue}if(x===destNode||destNode&&isChild(destNode,x)){failures.push(x.name+'：不能貼入自身或子資料夾');continue}if(clipboard.cut&&x.parent===destNode){done.push(x);continue}try{for await(const [n] of dest.entries())if(n===x.name)throw Error('目標已有同名項目');const newHandle=await copyNode(x,dest,x.name);if(clipboard.cut){await window.BVFlushFileRecords?.();const previous=captureRecordPaths(x);await dirOf(x.parent).removeEntry(x.name,{recursive:x.kind==='directory'});x.parent=destNode;x.handle=newHandle;if(x.kind==='directory')await rebindDescendants(x);await relocateRecords(previous);if(selected===x.id&&x.kind==='file')handle=newHandle;done.push(x)}else{const newNode={id:++sequence,uuid:uuid(),name:x.name,handle:newHandle,parent:destNode,kind:x.kind,order:sequence,buffer:null};nodeDB.nodes[path(newNode)]=newNode.uuid;items.push(newNode);async function cloneChildren(oldP,newP){/* BLOCK B-350BF31E5F START: AREA A-6A7FC0B1 */for(const child of siblings(oldP)){const h=child.kind==='directory'?await newP.handle.getDirectoryHandle(child.name):await newP.handle.getFileHandle(child.name);const copy={id:++sequence,uuid:uuid(),name:child.name,handle:h,parent:newP,kind:child.kind,order:sequence,buffer:null};nodeDB.nodes[path(copy)]=copy.uuid;if(child.kind==='file'&&recordDB.files[child.uuid])recordDB.files[copy.uuid]=structuredClone(recordDB.files[child.uuid]);items.push(copy);if(child.kind==='directory')await cloneChildren(child,copy)}/* BLOCK B-350BF31E5F END. */}if(x.kind==='directory')await cloneChildren(x,newNode);else if(recordDB.files[x.uuid])recordDB.files[newNode.uuid]=structuredClone(recordDB.files[x.uuid]);await flushNodeDB();await flushRecordDB();done.push(newNode)}orderDirty=true}catch(e){failures.push(x.name+'：'+e.message)}}if(clipboard.cut&&!failures.length)clipboard=null;display();queueCloudSave();if(failures.length)alert('部分貼上失敗：\n'+failures.join('\n'));else toast('已貼上 '+done.length+' 個項目')/* BLOCK B-409DBBEDB2 END. */}
function operateMenu(left,top){/* BLOCK B-753B7697EE START: AREA A-6A7FC0B1 */const m=document.querySelector('#context-menu');m.replaceChildren();for(const [label,fn] of [['批量選取'+(batchMode?'（結束）':''),()=>{/* BLOCK B-EAE57E4C83 START: AREA A-6A7FC0B1 */batchMode=!batchMode;checkedIds.clear();display()/* BLOCK B-EAE57E4C83 END. */}],['刪除',deleteTargets],['剪下',()=>clipTargets(true)],['複製',()=>clipTargets(false)],['貼上',pasteTargets]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{/* BLOCK B-FA191A3785 START: AREA A-6A7FC0B1 */m.hidden=true;Promise.resolve().then(fn).catch(e=>alert('操作失敗：'+e.message))/* BLOCK B-FA191A3785 END. */};m.append(b)}positionMenu(m,left,top)/* BLOCK B-753B7697EE END. */}
function positionMenu(m,left,top){/* BLOCK B-30BF3B6CE6 START: AREA A-6A7FC0B1 */m.style.left=Math.max(8,Math.min(left,innerWidth-190))+'px';m.style.top=Math.max(8,Math.min(top,innerHeight-245))+'px';m.hidden=false/* BLOCK B-30BF3B6CE6 END. */}
function importFiles(x){/* BLOCK B-9243EE32A8 START: AREA A-6A7FC0B1 */if(cloudVirtualId&&root?.cloudId===cloudVirtualId){selected=x.id;rootSelected=false;cloudImport.value='';cloudImport.click()}else openLocalImportPicker(x)/* BLOCK B-9243EE32A8 END. */}
function menu(x,left,top){/* BLOCK B-561584BD68 START: AREA A-6A7FC0B1 */
 const m=document.querySelector('#context-menu');m.replaceChildren();
 for(const [label,fn] of [
  ['重新命名',()=>rename(x)],
  ['導入文件',()=>importFiles(x)],
  ['導出文件（ZIP）',()=>exportNode(x)],
  ['移動至…',()=>moveWithPicker(x)],
  ['批量選取',()=>{/* BLOCK B-C76B14FC8E START: AREA A-6A7FC0B1 */batchMode=true;checkedIds.add(x.id);if(x.kind==='directory')for(const y of items)if(isChild(y,x))checkedIds.add(y.id);display()/* BLOCK B-C76B14FC8E END. */}],
  [x.kind==='directory'?'刪除資料夾':'刪除文件',()=>{/* BLOCK B-379AFD131B START: AREA A-6A7FC0B1 */if(confirm('確定刪除 '+x.name+'？'))removeNode(x).catch(e=>alert('刪除失敗：'+e.message))/* BLOCK B-379AFD131B END. */}]
 ]){
  const b=document.createElement('button');b.textContent=label;
  b.onclick=()=>{/* BLOCK B-EEB9F54AEE START: AREA A-6A7FC0B1 */m.hidden=true;fn()/* BLOCK B-EEB9F54AEE END. */};m.append(b);
 }
 positionMenu(m,left,top);
/* BLOCK B-561584BD68 END. */}
document.addEventListener('click',e=>{/* BLOCK B-E27789ED1D START: AREA A-6A7FC0B1 */if(!e.target.closest('#context-menu')&&!e.target.closest('#explorer-operate'))document.querySelector('#context-menu').hidden=true/* BLOCK B-E27789ED1D END. */});
document.querySelector('#explorer-operate').onclick=e=>{/* BLOCK B-C4B19B196D START: AREA A-6A7FC0B1 */e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();operateMenu(r.left,r.bottom+5)/* BLOCK B-C4B19B196D END. */};document.querySelector('#root-open').onclick=openRoot;document.querySelector('#root-save').onclick=saveAll;document.querySelector('#root-close').onclick=closeRoot;document.querySelector('#add-fold').onclick=()=>{/* BLOCK B-2CE02FFE98 START: AREA A-6A7FC0B1 */if(!root){window.BVCreateNewDocument();return;}create('directory')/* BLOCK B-2CE02FFE98 END. */};document.querySelector('#add-file').onclick=async()=>{/* BLOCK B-8D2D4FC881 START: AREA A-6A7FC0B1 */if(!root){await openSingleFile(new File([''],'新文件.md',{type:'text/markdown'}));return}create('file')/* BLOCK B-8D2D4FC881 END. */};
sourceArea.addEventListener('input',()=>{/* BLOCK B-5F5D9AD345 START: AREA A-6A7FC0B1 */if(cloudVirtualId&&root?.cloudId===cloudVirtualId)queueCloudSave();if(virtualRoot&&!cloudVirtualId&&current())draftStore({id:current().uuid,name:current().name,rootName:root.name,content:sourceArea.value,updatedAt:Date.now()}).catch(console.error);sourceButton.textContent='Commit';sourceButton.title='內容已編輯，點擊提交';sourceButton.classList.add('commit-mode');sourceButton.classList.remove('edit-mode');try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({mode:'edit',rootName:root?.name||'',fileUUID:current()?.uuid||null,raw:sourceArea.value}))}catch{}/* BLOCK B-5F5D9AD345 END. */});
// Re-scan external file changes on focus and while the page is visible.
let scanBusy=false;async function syncExternal(){/* BLOCK B-D713771C34 START: AREA A-6A7FC0B1 */if(virtualRoot||!root||scanBusy||dirty||orderDirty)return;scanBusy=true;try{const old=new Map(items.map(x=>[path(x),x]));const found=[];async function walk(dir,parent,prefix){/* BLOCK B-180A138B31 START: AREA A-6A7FC0B1 */for await(const [name,h] of dir.entries()){if(h.kind!=='directory'&&!/\.(md|txt|pdf)$/i.test(name))continue;const key=prefix?prefix+'/'+name:name;let x=old.get(key);if(!x||x.kind!==h.kind){x={id:++sequence,name,handle:h,parent,kind:h.kind,order:sequence,buffer:null,uuid:nodeDB.nodes[key]||uuid()};nodeDB.nodes[key]=x.uuid;}else{x.handle=h;x.parent=parent;}found.push(x);if(h.kind==='directory')await walk(h,x,key)}/* BLOCK B-180A138B31 END. */}await walk(root,null,'');if(found.length!==items.length||found.some(x=>!items.includes(x))){items=found;const currentNode=items.find(x=>x.id===selected);if(!currentNode&&selected!==null){selected=null;setDocumentVisible(false)}display();await flushNodeDB()}}catch(e){console.warn('External refresh',e)}finally{scanBusy=false}/* BLOCK B-D713771C34 END. */}
window.addEventListener('focus',syncExternal);document.addEventListener('visibilitychange',()=>{/* BLOCK B-2154D05999 START: AREA A-6A7FC0B1 */if(!document.hidden)syncExternal()/* BLOCK B-2154D05999 END. */});setInterval(()=>{/* BLOCK B-E738FF279B START: AREA A-6A7FC0B1 */if(!document.hidden)syncExternal()/* BLOCK B-E738FF279B END. */},12000);
// Ctrl+S saves the complete open Root when present.
document.addEventListener('keydown',e=>{/* BLOCK B-CFB7CC84F7 START: AREA A-6A7FC0B1 */if(root&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopImmediatePropagation();saveAll()}/* BLOCK B-CFB7CC84F7 END. */},true);
window.BVSwitchEditorMode=(mode)=>switchMode(mode);
/* BLOCK B-C681CA29D7 END. */})();
// AREA A02 END: ExplorerManager

/* AREA A-6A7FC0B1 END. */
