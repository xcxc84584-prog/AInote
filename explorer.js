'use strict';
(()=>{
const aside=document.querySelector('#explorer'),tree=document.querySelector('#tree'),rootLabel=document.querySelector('#root-label');
let root=null,selected=null,items=[],sequence=0,orderDirty=false;
let batchMode=false;const checkedIds=new Set();let clipboard=null;
const ORDER_FILE=".bv-note-explorer-order.json";
const RECORD_FILE=".bv-note-records.json";
let recordDB={version:1,files:{}};
let recordWrite=Promise.resolve();
async function flushRecordDB(){if(!root)return;const target=root;const payload=JSON.stringify(recordDB,null,2);recordWrite=recordWrite.catch(()=>{}).then(async()=>{const h=await target.getFileHandle(RECORD_FILE,{create:true});const w=await h.createWritable();await w.write(payload);await w.close()});return recordWrite;}
async function loadRecordDB(){recordDB={version:1,files:{}};try{const h=await root.getFileHandle(RECORD_FILE);const data=JSON.parse(await(await h.getFile()).text());if(data&&data.version===1&&data.files&&typeof data.files==='object')recordDB=data;}catch(e){if(e.name!=='NotFoundError')console.warn('Record load failed',e)}}
window.BVGetFileRecords=key=>recordDB.files[key]||null;
window.BVPutFileRecords=(key,value)=>{if(!root||!key)return Promise.resolve();recordDB.files[key]=value;return flushRecordDB().catch(e=>{console.error('Record save failed',e);status('目錄/標註儲存失敗：'+e.message);throw e})};

// Metadata follows the logical document path when a file or enclosing folder changes name/location.
function captureRecordPaths(node){return [node,...items.filter(y=>isChild(y,node))].filter(y=>y.kind==='file').map(y=>({node:y,old:path(y)}));}
async function relocateRecords(snapshot,copy=false){
 if(!root||!snapshot?.length)return;
 const changes=[];
 for(const entry of snapshot){const from=entry.old,to=path(entry.node);if(from===to&&!copy)continue;
  const oldKey=root.name+'/'+from,newKey=root.name+'/'+to;
  const value=recordDB.files[oldKey];if(value){recordDB.files[newKey]=structuredClone(value);if(!copy)delete recordDB.files[oldKey];changes.push([oldKey,newKey,value]);}
  if(!copy&&readingPositions.has(from)){readingPositions.set(to,readingPositions.get(from));readingPositions.delete(from);}
 }
 if(!changes.length)return;
 await flushRecordDB();
 for(const [oldKey,newKey,value] of changes){
  try{localStorage.setItem('bv-note-annotations:'+newKey,JSON.stringify(value));if(!copy)localStorage.removeItem('bv-note-annotations:'+oldKey)}catch{}
 }
 const selectedFile=current();if(selectedFile?.kind==='file'&&changes.some(([,key])=>key===root.name+'/'+path(selectedFile)))window.BVActivateFileRecords?.(root.name+'/'+path(selectedFile));
}
function normalizeOrders(){const parents=[null,...items.filter(x=>x.kind==='directory')];for(const p of parents)siblings(p).forEach((x,i)=>x.order=i+1)}
async function loadOrders(){try{const h=await root.getFileHandle(ORDER_FILE);const data=JSON.parse(await(await h.getFile()).text());if(data.version!==1||!Array.isArray(data.paths))return;const ranks=new Map(data.paths.map((p,i)=>[p,i]));for(const x of items)x.order=ranks.has(path(x))?ranks.get(path(x)):100000+x.order;normalizeOrders()}catch(e){if(e.name!=='NotFoundError')console.warn('Explorer order load:',e)}}
async function saveOrders(){normalizeOrders();const data={version:1,paths:[]};const walk=p=>{for(const x of siblings(p)){data.paths.push(path(x));if(x.kind==='directory')walk(x)}};walk(null);const h=await root.getFileHandle(ORDER_FILE,{create:true});const w=await h.createWritable();await w.write(JSON.stringify(data,null,2));await w.close();orderDirty=false;}
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
const toast=s=>status(s);
function switchMode(mode, preserveLoadedMarkdown=false){const edit=mode==='edit';sourceArea.style.display=edit?'block':'none';editor.style.display=edit?'none':'block';editor.contentEditable='false';sourceButton.textContent=edit?'Commit':'Edit';sourceButton.classList.toggle('commit-mode',edit);sourceButton.classList.toggle('edit-mode',!edit);if(edit){sourceArea.value=rawMarkdown;}else{if(!preserveLoadedMarkdown)rawMarkdown=sourceArea.value;renderRaw();setTimeout(()=>window.BVRefreshFileRecords?.(),50);}document.querySelector('#mode-indicator').textContent='';refreshUnsaved();}
window.BVSaveSelectedFile=async(content)=>{
 const x=current();
 if(!x||x.kind!=='file'||handle!==x.handle)return null;
 try{const w=await x.handle.createWritable();await w.write(content);await w.close();await window.BVFlushFileRecords?.();x.buffer=null;dirty=false;status('已儲存：'+x.name);refreshUnsaved();return true;}
 catch(e){alert('儲存失敗：'+e.message);return false;}
};
sourceButton.onclick=async()=>{
 if(sourceArea.style.display==='none'){switchMode('edit');return}
 rawMarkdown=sourceArea.value;
 const ok=await save();
 if(!ok)return;
 switchMode('view');refreshUnsaved();
};
sourceButton.textContent='Commit';editor.contentEditable='false';switchMode('edit');
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
  const x={id:++sequence,name:'新文件.md',handle:file,parent:null,kind:'file',order:1,buffer:null};
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
async function scan(dir,parent){for await(const [n,h] of dir.entries()){if(h.kind!=='directory'&&!/\.(md|txt)$/i.test(n))continue;const x={id:++sequence,name:n,handle:h,parent,kind:h.kind,order:sequence,buffer:null};items.push(x);if(h.kind==='directory')await scan(h,x)}}
async function renameRoot(){
 if(!root)return;
 const oldRoot=root,oldName=oldRoot.name;
 const name=await inlineName('重新命名 Root',oldName);
 if(!name||name===oldName)return;
 if(/[\\/]/.test(name)||name==='.'||name==='..')return alert('名稱無效');
 // Never open a directory picker as a side effect of Rename.
 // Native move/rename is available only in browsers that implement it for directories.
 if(typeof oldRoot.move!=='function'){
  alert('此瀏覽器不支援直接重新命名 Root 資料夾。為避免誤觸本地資料夾選擇器或複製刪除造成資料遺失，本操作已取消。可先在檔案總管重新命名 Root，再於 BV-Note 重新開啟。');
  return;
 }
 try{
  await saveAll();
  await window.BVFlushFileRecords?.();
  await oldRoot.move(name);
  const oldPrefix=oldName+'/',newPrefix=name+'/';
  const migrated={version:recordDB.version||1,files:{}};
  for(const [key,value] of Object.entries(recordDB.files))migrated.files[key.startsWith(oldPrefix)?newPrefix+key.slice(oldPrefix.length):key]=value;
  recordDB=migrated;
  await flushRecordDB();
  for(const node of items.filter(x=>x.kind==='file')){
   const oldKey=oldPrefix+path(node),newKey=newPrefix+path(node);
   try{const cached=localStorage.getItem('bv-note-annotations:'+oldKey);if(cached!==null){localStorage.setItem('bv-note-annotations:'+newKey,cached);localStorage.removeItem('bv-note-annotations:'+oldKey)}}catch{}
  }
  const x=current();if(x?.kind==='file')window.BVActivateFileRecords?.(newPrefix+path(x));
  rootLabel.textContent=name;display();toast('Root 已重新命名為 '+name);
 }catch(e){alert('Root 重新命名失敗：'+e.message)}
}

function rootMenu(left,top){
 const m=document.querySelector('#context-menu');m.replaceChildren();
 for(const [label,fn] of [['新增 Fold',()=>create('directory',true)],['新增 File',()=>create('file',true)],['重新命名 Root',renameRoot],['儲存 Root',saveAll],['關閉 Root',closeRoot]]){
  const b=document.createElement('button');b.textContent=label;b.onclick=()=>{m.hidden=true;Promise.resolve().then(fn).catch(e=>alert(e.message))};m.append(b);
 }positionMenu(m,left,top);
}
function display(){tree.replaceChildren();if(!root)return;
 const rootRow=document.createElement('div');rootRow.className='tree-node root-tree-node';rootRow.style.paddingLeft='10px';
 const rootTitle=document.createElement('span');rootTitle.className='node-label';rootTitle.textContent=(rootCollapsed?'▸ ':'▾ ')+ '▣ '+root.name;rootRow.append(rootTitle);
 rootRow.onclick=()=>{rootCollapsed=!rootCollapsed;display()};
 rootRow.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();rootMenu(e.clientX,e.clientY)};
 let timer;rootRow.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const x=e.touches[0].clientX,y=e.touches[0].clientY;timer=setTimeout(()=>rootMenu(x,y),550)},{passive:true});
 for(const ev of ['touchend','touchcancel','touchmove'])rootRow.addEventListener(ev,()=>clearTimeout(timer),{passive:true});
 tree.append(rootRow);
 const draw=(parent,level)=>{siblings(parent).forEach((x,i)=>{const row=document.createElement('div');row.className='tree-node'+(selected===x.id?' selected':'');row.style.paddingLeft=(10+level*15)+'px';row.draggable=true;row.dataset.id=x.id;
const label=document.createElement('span');label.className='node-label';label.textContent=(x.kind==='directory'?(collapsed.has(x.id)?'▸ ':'▾ '):'▤ ')+x.name;const rank=document.createElement('small');rank.textContent=String(i+1);row.append(label,rank);if(batchMode){const cb=document.createElement('input');cb.type='checkbox';cb.className='node-check';cb.checked=checkedIds.has(x.id);cb.setAttribute('aria-label','選取 '+x.name);cb.onclick=e=>e.stopPropagation();cb.onchange=()=>{const on=cb.checked;for(const node of items){if(node===x||x.kind==='directory'&&isChild(node,x)){if(on)checkedIds.add(node.id);else checkedIds.delete(node.id)}}display()};row.append(cb)}row.onclick=()=>{if(x.kind==='directory'){selected=x.id;if(!collapsed.delete(x.id))collapsed.add(x.id);display();}else choose(x)};row.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();selected=x.id;display();if(batchMode&&checkedIds.size)operateMenu(e.clientX,e.clientY);else menu(x,e.clientX,e.clientY)};
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
tree.append(row);if(x.kind==='directory'&&!collapsed.has(x.id))draw(x,level+1)})};if(!rootCollapsed)draw(null,1)}
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
 if(x.kind==='directory'){selected=x.id;display();return}
 const wasViewing=sourceArea.style.display==='none';
 rememberReadingPosition();
 if(dirty&&current()&&current().kind==='file')current().buffer=wasViewing?rawMarkdown:sourceArea.value;
 selected=x.id;
 try{
  const f=await x.handle.getFile();rawMarkdown=x.buffer??await f.text();setName(x.name);handle=x.handle;
  dirty=x.buffer!==null;setDocumentVisible(true);switchMode(wasViewing?'view':'edit',true);
  if(wasViewing)restoreReadingPosition(x);
  else {readingRestoring=false;main.scrollTop=0;}
  toast('已開啟 '+path(x));display();window.BVActivateFileRecords?.((root?.name||'')+'/'+path(x));
 }catch(e){alert('開啟失敗：'+e.message)}
}
async function saveAll(){if(!root)return;const x=current();if(x&&dirty)x.buffer=rawMarkdown;let n=0;try{for(const f of items.filter(y=>y.kind==='file'&&y.buffer!==null)){const w=await f.handle.createWritable();await w.write(f.buffer);await w.close();f.buffer=null;n++}await saveOrders();await window.BVFlushFileRecords?.();await flushRecordDB();dirty=false;refreshUnsaved();toast('Root 已儲存：'+n+' 個修改文件，節點順序已記錄')}catch(e){alert('儲存失敗：'+e.message)}}
async function openRoot(){if(!window.showDirectoryPicker){alert('此瀏覽器不支援本地資料夾存取。請使用支援 File System Access API 的桌面版 Chrome/Edge，並以 HTTPS 或 localhost 開啟。');return}if(root&&(dirty||orderDirty)&&!confirm('切換 Root 前，未儲存修改可能遺失。繼續？'))return;try{const d=await showDirectoryPicker({mode:'readwrite'});root=d;rootCollapsed=false;readingPositions.clear();readingRestoreToken++;readingRestoring=false;items=[];selected=null;sequence=0;resetBatch();collapsed.clear();await scan(d,null);await loadOrders();await loadRecordDB();for(const node of items)if(node.kind==='directory')collapsed.add(node.id);orderDirty=false;rootLabel.textContent=d.name;rawMarkdown='';setName('未命名.md');dirty=false;setDocumentVisible(false);switchMode('edit');display();toast('已開啟 Root '+d.name)}catch(e){if(e.name!=='AbortError')alert('資料夾開啟失敗：'+e.message)}}
async function closeRoot(){if(!root)return;if((dirty||orderDirty)&&!confirm('有未儲存修改，仍要關閉 Root？'))return;root=null;rootCollapsed=false;readingPositions.clear();readingRestoreToken++;readingRestoring=false;items=[];selected=null;resetBatch();collapsed.clear();rootLabel.textContent='尚未選取 Root';rawMarkdown='';dirty=false;setName('未命名.md');setDocumentVisible(false);switchMode('edit');display()}
function dirOf(p){return p?p.handle:root}
function normalizeNewFileName(name){
 const trimmed=name.trim();
 return /\.[^./\\]+$/.test(trimmed)?trimmed:trimmed+'.md';
}
async function create(kind,forceRoot=false){if(!root){if(kind!=='directory')return alert('請先選取本地文件夾');const nm=await inlineName('建立 Root 文件夾','MyNotes');if(!nm)return;if(/[\\/]/.test(nm)||nm==='.'||nm==='..')return alert('名稱無效');if(!window.showDirectoryPicker)return alert('瀏覽器不支援本地資料夾選取');try{const parent=await showDirectoryPicker({mode:'readwrite'});root=await parent.getDirectoryHandle(nm,{create:true});rootCollapsed=false;items=[];selected=null;sequence=0;collapsed.clear();rootLabel.textContent=root.name;orderDirty=false;setDocumentVisible(false);display();toast('已建立 Root '+nm)}catch(err){if(err.name!=='AbortError')alert('建立 Root 失敗：'+err.message)}return;}const p=forceRoot?null:(current()?.kind==='directory'?current():current()?.parent||null);let nm=await inlineName('新增 '+kind,kind==='file'?'新文件.md':'新資料夾');if(!nm)return;if(kind==='file')nm=normalizeNewFileName(nm);if(nm.includes('/')||nm.includes('\\')||nm==='.'||nm==='..')return alert('名稱無效');try{const h=kind==='file'?await dirOf(p).getFileHandle(nm,{create:true}):await dirOf(p).getDirectoryHandle(nm,{create:true});const x={id:++sequence,name:nm,handle:h,parent:p,kind,order:sequence,buffer:kind==='file'?'':null};items.push(x);orderDirty=true;display();if(kind==='file')await choose(x)}catch(e){alert(e.message)}}
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
 await parent.removeEntry(x.name,{recursive:x.kind==='directory'});
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
async function pasteTargets(){if(!root||!clipboard?.nodes.length)return alert('剪貼簿沒有可貼上的項目');const cur=current();const destNode=cur?.kind==='directory'?cur:cur?.parent||null;const dest=dirOf(destNode);if(!dest)return alert('請先選擇 Root');let failures=[];const done=[];for(const entry of clipboard.nodes){const x=entry.node;if(!items.includes(x)){failures.push(entry.name+'：來源已不存在');continue}if(x===destNode||destNode&&isChild(destNode,x)){failures.push(x.name+'：不能貼入自身或子資料夾');continue}if(clipboard.cut&&x.parent===destNode){done.push(x);continue}try{for await(const [n] of dest.entries())if(n===x.name)throw Error('目標已有同名項目');const newHandle=await copyNode(x,dest,x.name);if(clipboard.cut){await window.BVFlushFileRecords?.();const previous=captureRecordPaths(x);await dirOf(x.parent).removeEntry(x.name,{recursive:x.kind==='directory'});x.parent=destNode;x.handle=newHandle;if(x.kind==='directory')await rebindDescendants(x);await relocateRecords(previous);if(selected===x.id&&x.kind==='file')handle=newHandle;done.push(x)}else{const newNode={id:++sequence,name:x.name,handle:newHandle,parent:destNode,kind:x.kind,order:sequence,buffer:null};items.push(newNode);async function cloneChildren(oldP,newP){for(const child of siblings(oldP)){const h=child.kind==='directory'?await newP.handle.getDirectoryHandle(child.name):await newP.handle.getFileHandle(child.name);const copy={id:++sequence,name:child.name,handle:h,parent:newP,kind:child.kind,order:sequence,buffer:null};items.push(copy);if(child.kind==='directory')await cloneChildren(child,copy)}}if(x.kind==='directory')await cloneChildren(x,newNode);done.push(newNode)}orderDirty=true}catch(e){failures.push(x.name+'：'+e.message)}}if(clipboard.cut&&!failures.length)clipboard=null;display();if(failures.length)alert('部分貼上失敗：\n'+failures.join('\n'));else toast('已貼上 '+done.length+' 個項目')}
function operateMenu(left,top){const m=document.querySelector('#context-menu');m.replaceChildren();for(const [label,fn] of [['批量選取'+(batchMode?'（結束）':''),()=>{batchMode=!batchMode;checkedIds.clear();display()}],['刪除',deleteTargets],['剪下',()=>clipTargets(true)],['複製',()=>clipTargets(false)],['貼上',pasteTargets]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{m.hidden=true;Promise.resolve().then(fn).catch(e=>alert('操作失敗：'+e.message))};m.append(b)}positionMenu(m,left,top)}
function positionMenu(m,left,top){m.style.left=Math.max(8,Math.min(left,innerWidth-190))+'px';m.style.top=Math.max(8,Math.min(top,innerHeight-245))+'px';m.hidden=false}
function menu(x,left,top){
 const m=document.querySelector('#context-menu');m.replaceChildren();
 for(const [label,fn] of [
  ['重新命名',()=>rename(x)],
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
document.querySelector('#explorer-operate').onclick=e=>{e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();operateMenu(r.left,r.bottom+5)};document.querySelector('#root-open').onclick=openRoot;document.querySelector('#root-save').onclick=saveAll;document.querySelector('#root-close').onclick=closeRoot;document.querySelector('#add-fold').onclick=()=>{if(!root){window.BVCreateNewDocument();return;}create('directory')};document.querySelector('#add-file').onclick=()=>create('file');
// Ctrl+S saves the complete open Root when present.
document.addEventListener('keydown',e=>{if(root&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopImmediatePropagation();saveAll()}},true);
})();
