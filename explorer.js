// AREA A02 START: ExplorerManager | File: explorer.js
'use strict';
(()=>{
const aside=document.querySelector('#explorer'),tree=document.querySelector('#tree'),rootLabel=document.querySelector('#root-label');
let root=null,selected=null,items=[],sequence=0,orderDirty=false;
// Virtual single-file root: all changes remain in IndexedDB until explicit Save.
let virtualRoot=false;
const DRAFT_DB='bv-note-single-file-drafts-v1';
function draftStore(value){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DRAFT_DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'id'});
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
   const db=request.result,tx=db.transaction('drafts','readwrite');
   tx.objectStore('drafts').put(value);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
  };
 });
}
function virtualFile(name,text){
 let data=text;
 return {kind:'file',name,async getFile(){return new File([data],name,{type:'text/plain'})},
 async createWritable(){let next='';return {async write(v){next=typeof v==='string'?v:await new Blob([v]).text()},async close(){data=next}}}};
}
async function openSingleFile(file){
 rememberRoot();
 if(!file||!/\.(md|markdown|txt)$/i.test(file.name)){alert('單檔匯入支援 MD、Markdown、TXT');return}
 if(dirty&&!confirm('目前文件尚未儲存，仍要切換？'))return;
 const content=await file.text(),name=file.name;
 virtualRoot=true;root={name:name.replace(/\.[^.]+$/,'')+' Root',kind:'directory'};
 rootSelected=false;rootCollapsed=false;items=[];selected=null;sequence=0;collapsed.clear();
 const x={id:++sequence,uuid:uuid(),name,handle:virtualFile(name,content),parent:null,kind:'file',order:1,buffer:content};
 items.push(x);nodeDB={version:1,rootId:uuid(),nodes:{[name]:x.uuid}};
 recordDB={version:2,files:{}};rootLabel.textContent=root.name+'（草稿）';
 await draftStore({id:x.uuid,name,rootName:root.name,content,updatedAt:Date.now()});
 await choose(x);dirty=true;refreshUnsaved();display();
 toast('單檔已匯入 IndexedDB 草稿；按 Save 才會寫入本地');
}
const singlePicker=document.createElement('input');singlePicker.type='file';
singlePicker.accept='.md,.markdown,.txt';singlePicker.hidden=true;document.body.append(singlePicker);
document.querySelector('#root-import-file').onclick=()=>{singlePicker.value='';singlePicker.click()};
singlePicker.onchange=()=>openSingleFile(singlePicker.files[0]).catch(e=>alert(e.message));
async function saveVirtual(){
 const x=current();if(!x)return;
 const content=sourceArea.style.display==='none'?rawMarkdown:sourceArea.value;
 await draftStore({id:x.uuid,name:x.name,rootName:root.name,content,updatedAt:Date.now()});
 if(!window.showSaveFilePicker){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));a.download=x.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
 }else{
  try{const dest=await showSaveFilePicker({suggestedName:x.name,types:[{description:'Markdown / Text',accept:{'text/plain':['.md','.markdown','.txt']}}]});
   const writer=await dest.createWritable();await writer.write(content);await writer.close();
  }catch(err){if(err.name==='AbortError')return;throw err}
 }
 x.handle=virtualFile(x.name,content);x.buffer=null;dirty=false;refreshUnsaved();toast('已儲存本地文件：'+x.name);
}

let rootSelected=false;const SESSION_KEY="bv-note-session-v241";
let batchMode=false;const checkedIds=new Set();let clipboard=null;
const ORDER_FILE=".bv-note-explorer-order.json";
const RECORD_FILE=".bv-note-records.json";
// Stable UUIDs are random identifiers (not content hashes); persisted in Root metadata.
const ID_FILE='.bv-note-node-ids.json';
let nodeDB={version:1,rootId:null,nodes:{}};
let recordDB={version:2,files:{}};
let recordWrite=Promise.resolve(),nodeWrite=Promise.resolve();
const uuid=()=>crypto.randomUUID();
async function writeJSON(target,name,data){const h=await target.getFileHandle(name,{create:true});const w=await h.createWritable();await w.write(JSON.stringify(data,null,2));await w.close()}
async function flushRecordDB(){if(!root||virtualRoot)return;const target=root,payload=structuredClone(recordDB);recordWrite=recordWrite.catch(()=>{}).then(()=>writeJSON(target,RECORD_FILE,payload));return recordWrite;}
async function flushNodeDB(){if(!root||virtualRoot)return;const target=root,payload=structuredClone(nodeDB);nodeWrite=nodeWrite.catch(()=>{}).then(()=>writeJSON(target,ID_FILE,payload));return nodeWrite;}
function canonicalRecordKey(key){if(!key)return '';const prefix=root?.name+'/';if(prefix&&key.startsWith(prefix))return key.slice(prefix.length);const exact=items.filter(x=>x.kind==='file').map(x=>path(x));return exact.find(p=>key===p||key.endsWith('/'+p))||key;}
async function loadNodeDB(){
 nodeDB={version:1,rootId:null,nodes:{}};
 try{const data=JSON.parse(await(await root.getFileHandle(ID_FILE)).getFile().then(f=>f.text()));if(data?.nodes&&typeof data.nodes==='object')nodeDB=data}catch(e){if(e.name!=='NotFoundError')console.warn('ID load failed',e)}
 let changed=false;
 if(!nodeDB.rootId){nodeDB.rootId=uuid();changed=true}
 const existing=new Set();const used=new Set([nodeDB.rootId]);
 for(const x of items){const key=path(x);existing.add(key);let id=nodeDB.nodes[key];if(!id||used.has(id)){id=uuid();changed=true}used.add(id);x.uuid=id;if(nodeDB.nodes[key]!==id){nodeDB.nodes[key]=id;changed=true}}
 for(const key of Object.keys(nodeDB.nodes))if(!existing.has(key)){delete nodeDB.nodes[key];changed=true}
 if(changed)await flushNodeDB();
}
async function loadRecordDB(){
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
}
function resolveRecordId(key){return items.find(x=>x.kind==='file'&&(x.uuid===key||path(x)===canonicalRecordKey(key)))?.uuid||key}
window.BVGetFileRecords=key=>recordDB.files[resolveRecordId(key)]||null;
window.BVPutFileRecords=(key,value)=>{if(!root||!key)return Promise.resolve();recordDB.files[resolveRecordId(key)]=value;return flushRecordDB().catch(e=>{status('目錄/標註儲存失敗：'+e.message);throw e})};
window.BVGetCurrentFileId=()=>current()?.uuid||null;
window.BVCloudLocalSelection=async()=>{const x=current();if(!root||!x||x.kind!=='file')throw Error('請先在 Explorer 選取本地 File');const file=await x.handle.getFile();return {id:x.uuid,name:x.name,path:path(x),text:x.buffer!==null?x.buffer:await file.text(),unsaved:dirty&&selected===x.id,rootName:root.name};};
window.BVCloudLocalFolder=async()=>{if(!root)throw Error('請先選取本地 Root');const x=current();if(!rootSelected&&x?.kind!=='directory')throw Error('請在 Explorer 選取 Root 或 Fold');const folder=rootSelected?null:x;const prefix=folder?path(folder)+'/':'';const files=[];for(const n of items.filter(n=>n.kind==='file'&&(!folder||isChild(n,folder)))){const file=await n.handle.getFile();files.push({id:n.uuid,name:n.name,path:folder?path(n).slice(prefix.length):path(n),text:n.buffer!==null?n.buffer:await file.text()});}return {name:folder?.name||root.name,files};};
window.BVCloudFolderHandle=()=>{if(!root)throw Error('請先開啟本地 Root');const x=current();if(rootSelected)return {handle:root,name:root.name};if(x?.kind==='directory')return {handle:x.handle,name:x.name};throw Error('請先在 Explorer 選取 Fold 或 Root（不能選取單一 File）')};
window.BVCloudRootHandle=()=>{if(!root)throw Error('請先開啟本地 Root');return {handle:root,name:root.name}};
window.BVCloudImportText=async(name,text)=>{if(!root)throw Error('請先選取本地 Root');const safe=String(name||'cloud.md').replace(/[\\/]/g,'_');if(!/\.(md|txt)$/i.test(safe))throw Error('僅支援 Markdown 或 TXT');let target=safe,i=1;while(true){try{await root.getFileHandle(target);target=safe.replace(/(\.[^.]+)$/,`_cloud${i++}$1`);}catch(e){if(e.name==='NotFoundError')break;throw e;}}const handle=await root.getFileHandle(target,{create:true});const w=await handle.createWritable();await w.write(text);await w.close();await syncExternal();return target;};
function captureRecordPaths(node){return [node,...items.filter(y=>isChild(y,node))].map(y=>({node:y,old:path(y)}));}
async function relocateRecords(snapshot,copy=false){
 if(!root||!snapshot?.length)return;
 for(const entry of snapshot){const x=entry.node,from=entry.old,to=path(x);if(copy){const previous=x.uuid;x.uuid=uuid();if(x.kind==='file'&&recordDB.files[previous])recordDB.files[x.uuid]=structuredClone(recordDB.files[previous]);}else if(readingPositions.has(from)){readingPositions.set(to,readingPositions.get(from));readingPositions.delete(from)}
  delete nodeDB.nodes[from];nodeDB.nodes[to]=x.uuid;
 }
 await flushNodeDB();await flushRecordDB();
}
function normalizeOrders(){const parents=[null,...items.filter(x=>x.kind==='directory')];for(const p of parents)siblings(p).forEach((x,i)=>x.order=i+1)}
async function loadOrders(){try{const h=await root.getFileHandle(ORDER_FILE);const data=JSON.parse(await(await h.getFile()).text());if(!Array.isArray(data.ids)&&!Array.isArray(data.paths))return;const ranks=new Map((data.ids||data.paths).map((p,i)=>[p,i]));for(const x of items)x.order=ranks.has(x.uuid)?ranks.get(x.uuid):ranks.has(path(x))?ranks.get(path(x)):100000+x.order;normalizeOrders()}catch(e){if(e.name!=='NotFoundError')console.warn('Explorer order load:',e)}}
async function saveOrders(){if(virtualRoot)return;normalizeOrders();const data={version:2,ids:[]};const walk=p=>{for(const x of siblings(p)){data.ids.push(x.uuid);if(x.kind==='directory')walk(x)}};walk(null);const h=await root.getFileHandle(ORDER_FILE,{create:true});const w=await h.createWritable();await w.write(JSON.stringify(data,null,2));await w.close();orderDirty=false;}
const collapsed=new Set();let rootCollapsed=false;
const edge=document.querySelector('#sider-edge');
const closeSider=document.querySelector('#sider-close');
function setSider(open){aside.classList.toggle('collapsed',!open);document.querySelector('.workspace').classList.toggle('explorer-hidden',!open);edge.setAttribute('aria-expanded',String(open));edge.title=open?'Explorer 已開啟':'開啟 Explorer';}
window.BVToggleExplorer=()=>setSider(aside.classList.contains('collapsed'));
window.BVSetExplorerOpen=setSider;
edge.onclick=window.BVToggleExplorer;
closeSider.onclick=()=>setSider(false);
// Resizable sider using pointer events, preserving independent scroll containers.
const grip=document.querySelector('#sider-resizer');
let dragId=null;grip.addEventListener('pointerdown',ev=>{if(aside.classList.contains('collapsed'))return;dragId=ev.pointerId;grip.setPointerCapture(dragId);document.body.classList.add('resizing-sider');ev.preventDefault()});
grip.addEventListener('pointermove',ev=>{if(dragId!==ev.pointerId)return;const width=Math.max(190,Math.min(window.innerWidth-180,ev.clientX-aside.getBoundingClientRect().left));aside.style.width=width+'px';try{localStorage.setItem('bv-note-sider-width',String(width))}catch{}});
const stopDrag=()=>{dragId=null;document.body.classList.remove('resizing-sider')};grip.addEventListener('pointerup',stopDrag);grip.addEventListener('pointercancel',stopDrag);
try{const w=Number(localStorage.getItem('bv-note-sider-width'));if(w>=190)aside.style.width=Math.min(w,window.innerWidth-180)+'px'}catch{}
let touchX=null;aside.addEventListener('touchstart',ev=>{if(ev.touches.length===1)touchX=ev.touches[0].clientX},{passive:true});aside.addEventListener('touchend',ev=>{if(touchX!==null&&ev.changedTouches.length===1&&touchX-ev.changedTouches[0].clientX>100)setSider(false);touchX=null},{passive:true});
// The editor is hidden until a document is selected or explicitly opened/created.
const main=document.querySelector('.workspace main');
const emptyNotice=document.createElement('div');emptyNotice.id='empty-document-notice';emptyNotice.textContent='請創建新文檔或使用「設定」開啟舊文檔\n複製貼上AI聊天內容請確保為完整的md格式';main.append(emptyNotice);
const unsaved=document.createElement('span');unsaved.id='unsaved-notice';unsaved.textContent='[!] 文件未保存';document.querySelector('.editor-topbar').append(unsaved);
let documentVisible=false;
function setDocumentVisible(visible){documentVisible=Boolean(visible);main.classList.toggle('no-document',!documentVisible);refreshUnsaved()}
function refreshUnsaved(){unsaved.hidden=!documentVisible||!dirty}
window.BVSetDocumentVisible=setDocumentVisible;
window.BVRefreshUnsaved=refreshUnsaved;
setDocumentVisible(false);
const editableExt=/\.(md|markdown|txt|ainote)$/i;
const isPdfFile=name=>/\.pdf$/i.test(name||'');
const toast=s=>status(s);
function switchMode(mode, preserveLoadedMarkdown=false){if(window.BVPdfViewer?.active){window.BVPdfViewer.hide()}const edit=mode==='edit';try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({mode,rootName:root?.name||'',fileUUID:current()?.uuid||null,raw:edit?sourceArea.value:rawMarkdown}))}catch{};sourceArea.style.display=edit?'block':'none';editor.style.display=edit?'none':'block';editor.contentEditable='false';sourceButton.textContent=edit?'Commit':'Edit';sourceButton.title=edit?'儲存本地文件並切換至瀏覽模式':'切換至本地編輯模式';sourceButton.classList.toggle('commit-mode',edit);sourceButton.classList.toggle('edit-mode',!edit);if(edit){sourceArea.value=rawMarkdown;}else{if(!preserveLoadedMarkdown)rawMarkdown=sourceArea.value;renderRaw();setTimeout(()=>window.BVRefreshFileRecords?.(),50);}document.querySelector('#mode-indicator').textContent='';refreshUnsaved();}
window.BVSaveSelectedFile=async(content)=>{if(virtualRoot){sourceArea.value=content;await saveVirtual();return true;}
 const x=current();
 if(!x||x.kind!=='file'||handle!==x.handle)return null;
 try{const w=await x.handle.createWritable();await w.write(content);await w.close();await window.BVFlushFileRecords?.();x.buffer=null;dirty=false;status('已儲存：'+x.name);refreshUnsaved();return true;}
 catch(e){alert('儲存失敗：'+e.message);return false;}
};
sourceButton.onclick=async()=>{
 if(window.BVPdfViewer?.active)return;
 // Local mode only: Commit saves Markdown and enters preview; Edit returns to editor.
 if(sourceArea.style.display==='none'){switchMode('edit');return;}
 const nextRaw=sourceArea.value;
 const ok=await save();
 if(!ok)return;
 rawMarkdown=nextRaw;
 switchMode('view',true);
 refreshUnsaved();
};
editor.contentEditable='false';switchMode('edit');
// New document transaction: choose parent -> create Root -> create Markdown -> display.
window.BVCreateNewDocument=async()=>{
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
};
window.BVDetachExplorerSelection=()=>{selected=null;display()};
function current(){return items.find(x=>x.id===selected)}
function path(x){let parts=[x.name],p=x.parent;while(p){parts.unshift(p.name);p=p.parent;}return parts.join('/');}
function siblings(p){return items.filter(x=>x.parent===p).sort((a,b)=>a.order-b.order)}
async function scan(dir,parent){for await(const [n,h] of dir.entries()){if(h.kind!=='directory'&&!/\.(md|txt|pdf)$/i.test(n))continue;const x={id:++sequence,name:n,handle:h,parent,kind:h.kind,order:sequence,buffer:null};items.push(x);if(h.kind==='directory')await scan(h,x)}}
async function renameRoot(){
 if(!root)return;
 const oldRoot=root,oldName=oldRoot.name;
 const name=await inlineName('重新命名 Root',oldName);
 if(!name||name===oldName)return;
 if(/[\\/]/.test(name)||name==='.'||name==='..')return alert('名稱無效');
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
  async function copyVerify(src,dst){
   for await(const [entryName,h] of src.entries()){
    if(h.kind==='directory'){const d=await dst.getDirectoryHandle(entryName,{create:true});await copyVerify(h,d)}
    else{const file=await h.getFile();const out=await dst.getFileHandle(entryName,{create:true});const w=await out.createWritable();await w.write(await file.arrayBuffer());await w.close();const verify=await out.getFile();if(verify.size!==file.size)throw Error('複製驗證失敗：'+entryName)}
   }
  }
  await copyVerify(oldRoot,target);
  root=target;await openRootFromHandle(target);
  alert('新 Root「'+name+'」已建立並驗證。\n舊 Root「'+oldName+'」已保留作為備份，請確認目錄與標註正常後，再自行刪除舊資料夾。');
 }catch(e){if(e.name!=='AbortError')alert('Root 重新命名失敗：'+e.message)}
}
// AREA MULTIROOT START: independent Root workspaces and active-file routing.
const rootWorkspaces=[];
let switchingRoot=false;
function snapshotRoot(){
 if(!root)return null;
 const active=current();
 if(active?.kind==='file'&&dirty)active.buffer=sourceArea.style.display==='none'?rawMarkdown:sourceArea.value;
 return {root,items,selected,sequence,orderDirty,virtualRoot,rootSelected,rootCollapsed,
  collapsed:new Set(collapsed),nodeDB,recordDB,recordWrite,nodeWrite,
  activeUUID:active?.kind==='file'?active.uuid:null};
}
function rememberRoot(){const snap=snapshotRoot();if(!snap)return;
 const i=rootWorkspaces.findIndex(w=>w.root===root);
 if(i<0)rootWorkspaces.push(snap);else rootWorkspaces[i]=snap;
}
async function activateRoot(target){
 if(!target||switchingRoot||target.root===root)return;
 switchingRoot=true;
 try{
  rememberRoot();
  root=target.root;items=target.items;selected=target.selected;sequence=target.sequence;
  orderDirty=target.orderDirty;virtualRoot=target.virtualRoot;
  rootSelected=target.rootSelected;rootCollapsed=target.rootCollapsed;
  collapsed.clear();for(const id of target.collapsed)collapsed.add(id);
  nodeDB=target.nodeDB;recordDB=target.recordDB;recordWrite=target.recordWrite;nodeWrite=target.nodeWrite;
  resetBatch();rootLabel.textContent=root.name;dirty=false;
  const file=items.find(x=>x.uuid===target.activeUUID&&x.kind==='file');
  selected=null;
  if(file)await choose(file);
  else {rawMarkdown='';setName('未命名.md');setDocumentVisible(false);switchMode('edit');display();}
 }finally{switchingRoot=false;}
}
function renderOtherRoots(){
 for(const workspace of rootWorkspaces){if(workspace.root===root)continue;
  const row=document.createElement('div');row.className='tree-node root-tree-node';
  row.style.paddingLeft='10px';row.style.cursor='pointer';
  const label=document.createElement('span');label.className='node-label';label.textContent='▸ ▣ '+workspace.root.name;
  row.append(label);row.title='切換至此 Root（操作以所選文件所屬 Root 為準）';
  row.onclick=()=>activateRoot(workspace).catch(e=>alert('Root 切換失敗：'+e.message));
  tree.append(row);
  // Show every opened Root's tree; selecting a file activates its owning Root first.
  const drawInactive=(parent,depth)=>{
   const children=workspace.items.filter(x=>x.parent===parent).sort((a,b)=>a.order-b.order);
   for(const x of children){
    if(explorerQuery&&!x.name.toLocaleLowerCase().includes(explorerQuery)&&!workspace.items.some(y=>y.name.toLocaleLowerCase().includes(explorerQuery)&&(()=>{let a=y.parent;while(a){if(a===x)return true;a=a.parent}return false})()))continue;
    const node=document.createElement('div');node.className='tree-node';node.style.paddingLeft=(10+depth*15)+'px';
    const name=document.createElement('span');name.className='node-label';name.textContent=(x.kind==='directory'?'▾ ':'▤ ')+x.name;node.append(name);
    node.onclick=async()=>{try{await activateRoot(workspace);const live=items.find(y=>y.uuid===x.uuid);if(live){if(live.kind==='file')await choose(live);else{selected=live.id;rootSelected=false;display()}}}catch(e){alert('切換文件失敗：'+e.message)}};
    tree.append(node);if(x.kind==='directory')drawInactive(x,depth+1);
   }
  };
  drawInactive(null,1);
 }
}
// AREA ROOT ORDER START: opened order, draggable root headers, touch long-press reorder.
let rootDrag=null;
function reorderRoot(source,target){
 if(!source||!target||source===target)return;
 rememberRoot();const from=rootWorkspaces.findIndex(w=>w.root===source),to=rootWorkspaces.findIndex(w=>w.root===target);
 if(from<0||to<0)return;
 const [entry]=rootWorkspaces.splice(from,1);rootWorkspaces.splice(to,0,entry);display();
}
function enableRootOrdering(){
 const headers=[...tree.querySelectorAll('.root-tree-node')];
 for(const header of headers){
  const name=header.querySelector('.node-label')?.textContent||'';
  const workspace=rootWorkspaces.find(w=>name.includes('▣ '+w.root.name));if(!workspace)continue;
  header.draggable=true;header.title=(header.title||'')+'｜拖曳排序，觸控長按後移動';
  header.addEventListener('dragstart',e=>{rootDrag=workspace.root;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','bv-root-order')});
  header.addEventListener('dragover',e=>{if(rootDrag){e.preventDefault();header.classList.add('root-order-target')}});
  header.addEventListener('dragleave',()=>header.classList.remove('root-order-target'));
  header.addEventListener('drop',e=>{if(!rootDrag)return;e.preventDefault();header.classList.remove('root-order-target');reorderRoot(rootDrag,workspace.root);rootDrag=null});
  header.addEventListener('dragend',()=>{rootDrag=null;header.classList.remove('root-order-target')});
  let press=null,ready=false;
  header.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;ready=false;press=setTimeout(()=>{ready=true;header.classList.add('root-order-target')},550)},{passive:true});
  header.addEventListener('touchmove',e=>{if(!ready)return;const t=e.touches[0],other=document.elementFromPoint(t.clientX,t.clientY)?.closest('.root-tree-node');headers.forEach(h=>h.classList.toggle('root-order-target',h===other))},{passive:true});
  header.addEventListener('touchend',e=>{clearTimeout(press);if(ready){const t=e.changedTouches[0],other=document.elementFromPoint(t.clientX,t.clientY)?.closest('.root-tree-node');const target=other&&rootWorkspaces.find(w=>(other.querySelector('.node-label')?.textContent||'').includes('▣ '+w.root.name));if(target)reorderRoot(workspace.root,target.root);e.preventDefault()}ready=false;headers.forEach(h=>h.classList.remove('root-order-target'))});
  header.addEventListener('touchcancel',()=>{clearTimeout(press);ready=false;headers.forEach(h=>h.classList.remove('root-order-target'))});
 }
 // Rendered active Root may be anywhere: move each Root section to its open-order position.
 const sections=[];let currentSection=null;
 for(const node of [...tree.children]){if(node.classList.contains('root-tree-node')){currentSection=[];sections.push({root:rootWorkspaces.find(w=>(node.querySelector('.node-label')?.textContent||'').includes('▣ '+w.root.name))?.root,nodes:currentSection})}if(currentSection)currentSection.push(node)}
 for(const w of rootWorkspaces){const section=sections.find(x=>x.root===w.root);if(section)for(const node of section.nodes)tree.append(node)}
}
// AREA ROOT ORDER END
// AREA MULTIROOT END
async function openRootFromHandle(d){virtualRoot=false;
 const previousSession=(()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}})();
 root=d;rootSelected=false;rootCollapsed=false;readingPositions.clear();readingRestoreToken++;readingRestoring=false;
 items=[];selected=null;sequence=0;resetBatch();collapsed.clear();await scan(d,null);await loadNodeDB();await loadOrders();await loadRecordDB();
 for(const node of items)if(node.kind==='directory')collapsed.add(node.id);
 orderDirty=false;rootLabel.textContent=d.name;rawMarkdown='';setName('未命名.md');dirty=false;setDocumentVisible(false);switchMode('edit');display();
 try{const session=previousSession;if(session?.rootName===d.name){const target=items.find(x=>x.uuid===session.fileUUID);if(target){await choose(target);if(session.mode==='view')switchMode('view',true);else{switchMode('edit',true);if(typeof session.raw==='string'&&session.raw!==rawMarkdown){sourceArea.value=session.raw;rawMarkdown=session.raw;dirty=true;refreshUnsaved()}}}}}catch(err){console.warn('Session restore',err)}
}

// Import a copy into the selected directory (or the selected file's parent).
const importPicker=document.createElement('input');importPicker.type='file';importPicker.accept='.md,.txt,.pdf';importPicker.multiple=true;importPicker.hidden=true;document.body.append(importPicker);
let importDestination=null;
function importFiles(destination){
 if(!root)return alert('請先開啟 Root');
 importDestination=destination?.kind==='directory'?destination:destination?.parent||null;
 importPicker.value='';importPicker.click();
}
importPicker.addEventListener('change',async()=>{
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
});
// Standards-compliant ZIP (stored entries); no network dependency.
function zipCRC(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function makeZip(entries){
 const enc=new TextEncoder(),parts=[],central=[];let offset=0;
 const u16=(v)=>[v&255,(v>>>8)&255],u32=(v)=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 for(const entry of entries){const name=enc.encode(entry.name),data=entry.data,crc=zipCRC(data),flags=0x800;
  const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);parts.push(local,data);
  central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(entry.name.endsWith('/')?16:0),...u32(offset),...name]));offset+=local.length+data.length;
 }
 const centralSize=central.reduce((n,x)=>n+x.length,0);const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralSize),...u32(offset),...u16(0)]);
 return new Blob([...parts,...central,end],{type:'application/zip'});
}
async function exportNode(node){
 if(!root)return;const entries=[];const base=node?node.name:root.name;
 async function collect(handle,name){if(handle.kind==='file'){entries.push({name,data:new Uint8Array(await(await handle.getFile()).arrayBuffer())});return}
  entries.push({name:name+'/',data:new Uint8Array()});for await(const [child,h] of handle.entries())await collect(h,name+'/'+child);
 }
 try{await collect(node?.handle||root,base);if(entries.length>65000)throw Error('ZIP 項目數量過多');const blob=makeZip(entries);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=base+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('已導出 '+base+'.zip');}catch(err){alert('導出失敗：'+err.message)}
}
function rootMenu(left,top){
 const m=document.querySelector('#context-menu');m.replaceChildren();
 for(const [label,fn] of [['新增 Fold',()=>create('directory',true)],['新增 File',()=>create('file',true)],['重新命名 Root',renameRoot],['導入文件',()=>importFiles(null)],['導出文件（ZIP）',()=>exportNode(null)],['儲存 Root',saveAll],['關閉 Root',closeRoot]]){
  const b=document.createElement('button');b.textContent=label;b.onclick=()=>{m.hidden=true;Promise.resolve().then(fn).catch(e=>alert(e.message))};m.append(b);
 }positionMenu(m,left,top);
}
const explorerSearchInput=document.querySelector('#explorer-search-input');
const explorerSearchStatus=document.querySelector('#explorer-search-status');
const explorerSearchClear=document.querySelector('#explorer-search-clear');
let explorerQuery='';
explorerSearchInput.addEventListener('input',()=>{explorerQuery=explorerSearchInput.value.trim().toLocaleLowerCase();display()});
explorerSearchClear.addEventListener('click',()=>{explorerSearchInput.value='';explorerQuery='';display();explorerSearchInput.focus()});
function display(){tree.replaceChildren();
 explorerSearchClear.hidden=!explorerQuery;
 if(!root){explorerSearchStatus.textContent='';renderOtherRoots();enableRootOrdering();return;}
 const matches=new Set();let directMatches=0;
 if(explorerQuery){for(const node of items){if(!node.name.toLocaleLowerCase().includes(explorerQuery))continue;directMatches++;matches.add(node.id);let ancestor=node.parent;while(ancestor){matches.add(ancestor.id);ancestor=ancestor.parent}}}
 explorerSearchStatus.textContent=explorerQuery?`符合 ${directMatches} 個項目` : '';

 const rootRow=document.createElement('div');rootRow.className='tree-node root-tree-node';rootRow.style.paddingLeft='10px';rootRow.classList.toggle('selected',rootSelected);
 const rootTitle=document.createElement('span');rootTitle.className='node-label';rootTitle.textContent=(rootCollapsed?'▸ ':'▾ ')+ '▣ '+root.name;rootRow.append(rootTitle);
 rootRow.onclick=e=>{rootSelected=true;selected=null;if(e.detail===2)rootCollapsed=!rootCollapsed;display()};
 rootRow.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();rootMenu(e.clientX,e.clientY)};
 let timer;rootRow.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const x=e.touches[0].clientX,y=e.touches[0].clientY;timer=setTimeout(()=>rootMenu(x,y),550)},{passive:true});
 for(const ev of ['touchend','touchcancel','touchmove'])rootRow.addEventListener(ev,()=>clearTimeout(timer),{passive:true});
 tree.append(rootRow);
 const draw=(parent,level)=>{siblings(parent).forEach((x,i)=>{if(explorerQuery&&!matches.has(x.id))return;const row=document.createElement('div');row.className='tree-node'+(selected===x.id?' selected':'');row.style.paddingLeft=(10+level*15)+'px';row.draggable=true;row.dataset.id=x.id;
const label=document.createElement('span');label.className='node-label';label.textContent=(x.kind==='directory'?(collapsed.has(x.id)?'▸ ':'▾ '):'▤ ')+x.name;const rank=document.createElement('small');rank.textContent=String(i+1);row.append(label,rank);if(batchMode){const cb=document.createElement('input');cb.type='checkbox';cb.className='node-check';cb.checked=checkedIds.has(x.id);cb.setAttribute('aria-label','選取 '+x.name);cb.onclick=e=>e.stopPropagation();cb.onchange=()=>{const on=cb.checked;for(const node of items){if(node===x||x.kind==='directory'&&isChild(node,x)){if(on)checkedIds.add(node.id);else checkedIds.delete(node.id)}}display()};row.append(cb)}row.onclick=()=>{if(x.kind==='directory'){selected=x.id;rootSelected=false;if(!collapsed.delete(x.id))collapsed.add(x.id);display();}else choose(x)};row.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();selected=x.id;display();if(batchMode&&checkedIds.size)operateMenu(e.clientX,e.clientY);else menu(x,e.clientX,e.clientY)};
// Long-press on mobile opens the same menu as desktop right-click.
let pressTimer=null,startX=0,startY=0,suppressClick=false;
row.addEventListener('touchstart',e=>{
 if(e.touches.length!==1)return;
 startX=e.touches[0].clientX;startY=e.touches[0].clientY;
 clearTimeout(pressTimer);
 pressTimer=setTimeout(()=>{
  pressTimer=null;suppressClick=true;selected=x.id;display();if(batchMode&&checkedIds.size)operateMenu(startX,startY);else menu(x,startX,startY);
 },550);
},{passive:true});
row.addEventListener('touchmove',e=>{
 if(!e.touches.length||Math.abs(e.touches[0].clientX-startX)>12||Math.abs(e.touches[0].clientY-startY)>12){clearTimeout(pressTimer);pressTimer=null}
},{passive:true});
row.addEventListener('touchend',()=>{clearTimeout(pressTimer);pressTimer=null},{passive:true});
row.addEventListener('touchcancel',()=>{clearTimeout(pressTimer);pressTimer=null},{passive:true});
row.addEventListener('click',e=>{if(suppressClick){e.stopImmediatePropagation();e.preventDefault();suppressClick=false}},true);
row.ondragstart=e=>{e.dataTransfer.setData('text/plain',String(x.id));e.dataTransfer.effectAllowed='move'};row.ondragover=e=>{e.preventDefault()};row.ondrop=async e=>{e.preventDefault();const moving=items.find(y=>y.id===Number(e.dataTransfer.getData('text/plain')));if(moving)await move(moving,x,e.shiftKey)};
tree.append(row);if(x.kind==='directory'&&(explorerQuery||!collapsed.has(x.id)))draw(x,level+1)})};if(explorerQuery||!rootCollapsed)draw(null,1);renderOtherRoots();enableRootOrdering()}
// v2.2.12: Remember the reading position independently for each Explorer file.
// The workspace main element is the actual scroll container (not window).
const readingPositions=new Map();
let readingRestoreToken=0;
let readingRestoring=false;
function readingKey(x){return x?path(x):null}
function rememberReadingPosition(){
 const x=current();
 if(x?.kind==='file' && sourceArea.style.display==='none')
  readingPositions.set(readingKey(x),main.scrollTop);
}
function restoreReadingPosition(x){
 const token=++readingRestoreToken;
 readingRestoring=true;
 const target=readingPositions.get(readingKey(x))??0;
 // Wait until the newly selected document has been rendered and laid out.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(token!==readingRestoreToken || selected!==x.id || sourceArea.style.display!=='none')return;
  main.scrollTop=target;
  requestAnimationFrame(()=>{if(token===readingRestoreToken)readingRestoring=false});
 }));
}
main.addEventListener('scroll',()=>{
 // Do not overwrite a stored position while the document is being replaced.
 if(readingRestoring)return;
 rememberReadingPosition();
},{passive:true});
async function choose(x){
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
}
async function saveAll(){if(!root)return;if(virtualRoot)return saveVirtual();const x=current();if(x&&dirty)x.buffer=rawMarkdown;let n=0;try{for(const f of items.filter(y=>y.kind==='file'&&y.buffer!==null)){const w=await f.handle.createWritable();await w.write(f.buffer);await w.close();f.buffer=null;n++}await saveOrders();await window.BVFlushFileRecords?.();await flushNodeDB();await flushRecordDB();dirty=false;refreshUnsaved();toast('Root 已儲存：'+n+' 個修改文件，節點順序已記錄')}catch(e){alert('儲存失敗：'+e.message)}}
async function openRoot(){
 if(!window.showDirectoryPicker){alert('此瀏覽器不支援本地資料夾存取。請使用支援 File System Access API 的桌面版 Chrome/Edge，並以 HTTPS 或 localhost 開啟。');return}
 try{
  const d=await showDirectoryPicker({mode:'readwrite'});
  rememberRoot();
  for(const w of rootWorkspaces){if(w.root===d||typeof w.root.isSameEntry==='function'&&await w.root.isSameEntry(d)){await activateRoot(w);return}}
  await openRootFromHandle(d);rememberRoot();toast('已加入 Root '+d.name);
 }catch(e){if(e.name!=='AbortError')alert('資料夾開啟失敗：'+e.message)}
}
async function closeRoot(){
 window.BVPdfViewer?.hide();sourceButton.hidden=false;if(!root)return;
 if((dirty||orderDirty||items.some(x=>x.buffer!==null))&&!confirm('此 Root 有未儲存修改，仍要關閉？'))return;
 const old=root;const next=rootWorkspaces.find(w=>w.root!==old);
 rootWorkspaces.splice(rootWorkspaces.findIndex(w=>w.root===old),1);
 root=null;virtualRoot=false;selected=null;items=[];sequence=0;orderDirty=false;
 rootSelected=false;rootCollapsed=false;collapsed.clear();resetBatch();dirty=false;
 rawMarkdown='';setName('未命名.md');setDocumentVisible(false);
 if(next)await activateRoot(next);else{rootLabel.textContent='尚未選取 Root';switchMode('edit');display()}
}
function dirOf(p){return p?p.handle:root}
function normalizeNewFileName(name){
 const trimmed=name.trim();
 return /\.[^./\\]+$/.test(trimmed)?trimmed:trimmed+'.md';
}
async function create(kind,forceRoot=false){if(virtualRoot)return alert('單一文件 Root 不允許新增子 Fold/File');if(!root){if(kind!=='directory')return alert('請先選取本地文件夾');const nm=await inlineName('建立 Root 文件夾','MyNotes');if(!nm)return;if(/[\\/]/.test(nm)||nm==='.'||nm==='..')return alert('名稱無效');if(!window.showDirectoryPicker)return alert('瀏覽器不支援本地資料夾選取');try{const parent=await showDirectoryPicker({mode:'readwrite'});root=await parent.getDirectoryHandle(nm,{create:true});nodeDB={version:1,rootId:uuid(),nodes:{}};await flushNodeDB();rootCollapsed=false;items=[];selected=null;sequence=0;collapsed.clear();rootLabel.textContent=root.name;orderDirty=false;setDocumentVisible(false);display();toast('已建立 Root '+nm)}catch(err){if(err.name!=='AbortError')alert('建立 Root 失敗：'+err.message)}return;}const p=(forceRoot||rootSelected)?null:(current()?.kind==='directory'?current():current()?.parent||null);let nm=await inlineName('新增 '+kind,kind==='file'?'新文件.md':'新資料夾');if(!nm)return;if(kind==='file')nm=normalizeNewFileName(nm);if(nm.includes('/')||nm.includes('\\')||nm==='.'||nm==='..')return alert('名稱無效');try{const h=kind==='file'?await dirOf(p).getFileHandle(nm,{create:true}):await dirOf(p).getDirectoryHandle(nm,{create:true});const x={id:++sequence,uuid:uuid(),name:nm,handle:h,parent:p,kind,order:sequence,buffer:kind==='file'?'':null};items.push(x);nodeDB.nodes[path(x)]=x.uuid;await flushNodeDB();orderDirty=true;display();if(kind==='file')await choose(x)}catch(e){alert(e.message)}}
function inlineName(title,value){return new Promise(resolve=>{const box=document.querySelector('#inline-name');box.replaceChildren();const lab=document.createElement('label');lab.textContent=title;const inp=document.createElement('input');inp.value=value;const ok=document.createElement('button');ok.textContent='確認';const cancel=document.createElement('button');cancel.textContent='取消';box.append(lab,inp,ok,cancel);box.hidden=false;inp.focus();inp.select();const done=v=>{box.hidden=true;resolve(v)};ok.onclick=()=>done(inp.value.trim());cancel.onclick=()=>done(null);inp.onkeydown=e=>{if(e.key==='Enter')done(inp.value.trim());if(e.key==='Escape')done(null)}})}
async function copyNode(x,target,name){
 if(x.kind==='file'){
  const h=await target.getFileHandle(name,{create:true});
  const w=await h.createWritable();
  try{await w.write(x.buffer??await(await x.handle.getFile()).arrayBuffer());await w.close()}catch(e){try{await w.abort()}catch{}throw e}
  return h;
 }
 const h=await target.getDirectoryHandle(name,{create:true});
 for(const c of siblings(x))await copyNode(c,h,c.name);
 return h;
}
function isChild(y,x){for(let p=y.parent;p;p=p.parent)if(p===x)return true;return false}
// A directory copy creates fresh FileSystemHandles for all descendants.
// Rebind them before deleting the source; otherwise future operations use stale handles.
async function rebindDescendants(dirNode){
 for(const child of siblings(dirNode)){
  child.handle=child.kind==='directory'
   ?await dirNode.handle.getDirectoryHandle(child.name)
   :await dirNode.handle.getFileHandle(child.name);
  if(child.kind==='directory')await rebindDescendants(child);
 }
}
async function removeNode(x){
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
 orderDirty=true;display();
}
async function rename(x){
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
  orderDirty=true;display();
 }catch(e){alert('重新命名失敗：'+e.message)}
}
async function move(x,target,after=false){
 if(!x||!target||x===target||isChild(target,x))return;
 const p=target.kind==='directory'&&!after?target:target.parent;
 if(x.parent===p){
  // Moving onto its own parent is a no-op, not a reordering operation.
  if(target===p)return;
  const arr=siblings(p).filter(y=>y!==x);
  const at=arr.indexOf(target);
  arr.splice(at<0?arr.length:at+(after?1:0),0,x);
  arr.forEach((y,i)=>y.order=i+1);
  orderDirty=true;display();return;
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
  orderDirty=true;display();toast('已移動 '+x.name);
 }catch(e){alert('移動失敗：'+e.message)}
}
async function moveWithPicker(x){
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
    orderDirty=true;display();toast('已移動至 Root');
   }catch(e){alert('移動失敗：'+e.message)}
  }
 }else await move(x,dest,false);
}
function targets(){const ids=batchMode&&checkedIds.size?[...checkedIds]:selected?[selected]:[];const nodes=ids.map(id=>items.find(x=>x.id===id)).filter(Boolean);return nodes.filter(x=>!nodes.some(y=>y!==x&&y.kind==='directory'&&isChild(x,y)));}
function resetBatch(){batchMode=false;checkedIds.clear();display()}
async function deleteTargets(){const nodes=targets();if(!nodes.length)return alert('請先選取文件或資料夾');if(!confirm('確定刪除 '+nodes.length+' 個項目及其子項目？此操作無法復原。'))return;let errors=[];for(const x of nodes){try{await removeNode(x)}catch(e){errors.push(x.name+'：'+e.message)}}if(errors.length)alert('部分刪除失敗：\n'+errors.join('\n'));else toast('已刪除 '+nodes.length+' 個項目');resetBatch()}
function clipTargets(cut){const nodes=targets();if(!nodes.length)return alert('請先選取文件或資料夾');clipboard={nodes:nodes.map(x=>({node:x,name:x.name,kind:x.kind})),cut};toast((cut?'已剪下 ':'已複製 ')+nodes.length+' 個項目，請選擇目的資料夾後貼上')}
async function pasteTargets(){if(!root||!clipboard?.nodes.length)return alert('剪貼簿沒有可貼上的項目');const cur=current();const destNode=cur?.kind==='directory'?cur:cur?.parent||null;const dest=dirOf(destNode);if(!dest)return alert('請先選擇 Root');let failures=[];const done=[];for(const entry of clipboard.nodes){const x=entry.node;if(!items.includes(x)){failures.push(entry.name+'：來源已不存在');continue}if(x===destNode||destNode&&isChild(destNode,x)){failures.push(x.name+'：不能貼入自身或子資料夾');continue}if(clipboard.cut&&x.parent===destNode){done.push(x);continue}try{for await(const [n] of dest.entries())if(n===x.name)throw Error('目標已有同名項目');const newHandle=await copyNode(x,dest,x.name);if(clipboard.cut){await window.BVFlushFileRecords?.();const previous=captureRecordPaths(x);await dirOf(x.parent).removeEntry(x.name,{recursive:x.kind==='directory'});x.parent=destNode;x.handle=newHandle;if(x.kind==='directory')await rebindDescendants(x);await relocateRecords(previous);if(selected===x.id&&x.kind==='file')handle=newHandle;done.push(x)}else{const newNode={id:++sequence,uuid:uuid(),name:x.name,handle:newHandle,parent:destNode,kind:x.kind,order:sequence,buffer:null};nodeDB.nodes[path(newNode)]=newNode.uuid;items.push(newNode);async function cloneChildren(oldP,newP){for(const child of siblings(oldP)){const h=child.kind==='directory'?await newP.handle.getDirectoryHandle(child.name):await newP.handle.getFileHandle(child.name);const copy={id:++sequence,uuid:uuid(),name:child.name,handle:h,parent:newP,kind:child.kind,order:sequence,buffer:null};nodeDB.nodes[path(copy)]=copy.uuid;if(child.kind==='file'&&recordDB.files[child.uuid])recordDB.files[copy.uuid]=structuredClone(recordDB.files[child.uuid]);items.push(copy);if(child.kind==='directory')await cloneChildren(child,copy)}}if(x.kind==='directory')await cloneChildren(x,newNode);else if(recordDB.files[x.uuid])recordDB.files[newNode.uuid]=structuredClone(recordDB.files[x.uuid]);await flushNodeDB();await flushRecordDB();done.push(newNode)}orderDirty=true}catch(e){failures.push(x.name+'：'+e.message)}}if(clipboard.cut&&!failures.length)clipboard=null;display();if(failures.length)alert('部分貼上失敗：\n'+failures.join('\n'));else toast('已貼上 '+done.length+' 個項目')}
function operateMenu(left,top){const m=document.querySelector('#context-menu');m.replaceChildren();for(const [label,fn] of [['批量選取'+(batchMode?'（結束）':''),()=>{batchMode=!batchMode;checkedIds.clear();display()}],['刪除',deleteTargets],['剪下',()=>clipTargets(true)],['複製',()=>clipTargets(false)],['貼上',pasteTargets]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{m.hidden=true;Promise.resolve().then(fn).catch(e=>alert('操作失敗：'+e.message))};m.append(b)}positionMenu(m,left,top)}
function positionMenu(m,left,top){m.style.left=Math.max(8,Math.min(left,innerWidth-190))+'px';m.style.top=Math.max(8,Math.min(top,innerHeight-245))+'px';m.hidden=false}
function menu(x,left,top){
 const m=document.querySelector('#context-menu');m.replaceChildren();
 for(const [label,fn] of [
  ['重新命名',()=>rename(x)],
  ['導入文件',()=>importFiles(x)],
  ['導出文件（ZIP）',()=>exportNode(x)],
  ['移動至…',()=>moveWithPicker(x)],
  ['批量選取',()=>{batchMode=true;checkedIds.add(x.id);if(x.kind==='directory')for(const y of items)if(isChild(y,x))checkedIds.add(y.id);display()}],
  [x.kind==='directory'?'刪除資料夾':'刪除文件',()=>{if(confirm('確定刪除 '+x.name+'？'))removeNode(x).catch(e=>alert('刪除失敗：'+e.message))}]
 ]){
  const b=document.createElement('button');b.textContent=label;
  b.onclick=()=>{m.hidden=true;fn()};m.append(b);
 }
 positionMenu(m,left,top);
}
document.addEventListener('click',e=>{if(!e.target.closest('#context-menu')&&!e.target.closest('#explorer-operate'))document.querySelector('#context-menu').hidden=true});
document.querySelector('#explorer-operate').onclick=e=>{e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();operateMenu(r.left,r.bottom+5)};document.querySelector('#root-open').onclick=openRoot;document.querySelector('#root-save').onclick=saveAll;document.querySelector('#root-close').onclick=closeRoot;document.querySelector('#add-fold').onclick=()=>{if(!root){window.BVCreateNewDocument();return;}create('directory')};document.querySelector('#add-file').onclick=async()=>{if(!root){await openSingleFile(new File([''],'新文件.md',{type:'text/markdown'}));return}create('file')};
sourceArea.addEventListener('input',()=>{if(virtualRoot&&current())draftStore({id:current().uuid,name:current().name,rootName:root.name,content:sourceArea.value,updatedAt:Date.now()}).catch(console.error);sourceButton.textContent='Commit';sourceButton.title='內容已編輯，點擊提交';sourceButton.classList.add('commit-mode');sourceButton.classList.remove('edit-mode');try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({mode:'edit',rootName:root?.name||'',fileUUID:current()?.uuid||null,raw:sourceArea.value}))}catch{}});
// Re-scan external file changes on focus and while the page is visible.
let scanBusy=false;async function syncExternal(){if(virtualRoot||!root||scanBusy||dirty||orderDirty)return;scanBusy=true;try{const old=new Map(items.map(x=>[path(x),x]));const found=[];async function walk(dir,parent,prefix){for await(const [name,h] of dir.entries()){if(h.kind!=='directory'&&!/\.(md|txt|pdf)$/i.test(name))continue;const key=prefix?prefix+'/'+name:name;let x=old.get(key);if(!x||x.kind!==h.kind){x={id:++sequence,name,handle:h,parent,kind:h.kind,order:sequence,buffer:null,uuid:nodeDB.nodes[key]||uuid()};nodeDB.nodes[key]=x.uuid;}else{x.handle=h;x.parent=parent;}found.push(x);if(h.kind==='directory')await walk(h,x,key)}}await walk(root,null,'');if(found.length!==items.length||found.some(x=>!items.includes(x))){items=found;const currentNode=items.find(x=>x.id===selected);if(!currentNode&&selected!==null){selected=null;setDocumentVisible(false)}display();await flushNodeDB()}}catch(e){console.warn('External refresh',e)}finally{scanBusy=false}}
window.addEventListener('focus',syncExternal);document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncExternal()});setInterval(()=>{if(!document.hidden)syncExternal()},12000);
// Ctrl+S saves the complete open Root when present.
document.addEventListener('keydown',e=>{if(root&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopImmediatePropagation();saveAll()}},true);
window.BVSwitchEditorMode=(mode)=>switchMode(mode);
})();
// AREA A02 END: ExplorerManager
