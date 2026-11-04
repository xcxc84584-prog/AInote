/* BV DIARY File Manager v0.3.17 - browser-only, metadata and handles local */
(()=>{
'use strict';
const DB='bv-diary-file-index-v1',STORE='entries',TAB='files';
let dbPromise,items=[],query='',viewFolder=null,active=false,busy=false,cloudRevision=null,cloudKnown=false,cloudMessage='尚未載入雲端索引（使用 DIARY 頂部載入／存儲）',editingId=null,menuId=null,menuPoint=null,pathPanel=false,selectedIds=new Set(),renderLimit=60;
let visibleObserver=null;
const DEVICE_KEY='bv-diary-file-device-id-v1';
function deviceId(){let v=localStorage.getItem(DEVICE_KEY);if(!v){v='device-'+id();localStorage.setItem(DEVICE_KEY,v)}return v}
const THIS_DEVICE=deviceId();
const DEVICE_LABEL_KEY='bv-diary-file-device-label-v1';
function deviceLabel(){return localStorage.getItem(DEVICE_LABEL_KEY)||('此裝置 '+THIS_DEVICE.slice(-8))}
function own(e){return e.virtual===true||e.device===THIS_DEVICE}
function accessible(e){return e.virtual===true||(e.device===THIS_DEVICE&&(!!e.handle||!!e.localPath))}
function visibleEntries(){return items.filter(e=>accessible(e))}
function normalizeLegacy(e){if(e.handle&&e.device!==THIS_DEVICE)return {...e,device:THIS_DEVICE};return e}

const $=(s,r=document)=>r.querySelector(s);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function id(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()}
function db(){return dbPromise??=new Promise((resolve,reject)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function all(){const d=await db();return new Promise((resolve,reject)=>{let r=d.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function put(v){const d=await db();return new Promise((resolve,reject)=>{let t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(v);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
async function del(k){const d=await db();return new Promise((resolve,reject)=>{let t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(k);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
async function reload(){const originals=await all();items=originals.map(normalizeLegacy);for(const e of items){if(e.handle&&e.device===THIS_DEVICE&&originals.find(x=>x.id===e.id)?.device!==THIS_DEVICE)await put(e)}selectedIds=new Set([...selectedIds].filter(k=>items.some(x=>x.id===k)));render()}
function current(){return document.querySelector('#bv-diary')}
function tabBar(){return current()?.querySelector('.dy-tabs')}
function content(){return current()?.querySelector('#dy-content')}
function ensure(){
 const bar=tabBar();if(!bar)return;
 if(!bar.querySelector('[data-tab="files"]')){
  let b=document.createElement('button');b.type='button';b.dataset.tab='files';b.setAttribute('role','tab');b.textContent='文件管家';bar.appendChild(b);
 }
 if(active){
  let c=content();if(c){if(!c.querySelector('#dy-file-manager'))c.innerHTML='<div id="dy-file-manager"></div>';render()}
  bar.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===TAB)));
 }
}
function pathFor(e){return e.relativePath||e.name}
function iconType(e){
 if(e.kind==='directory')return 'folder';
 const ext=(e.name.split('.').pop()||'').toLowerCase();
 if(['txt','md','markdown','log','csv','ini','rtf'].includes(ext))return 'text';
 if(['c','h','cpp','hpp','cc','cs','py','js','jsx','ts','tsx','java','go','rs','html','css','json','xml','sh','ps1','sql','php','rb'].includes(ext))return 'code';
 if(['zip','rar','7z','tar','gz','bz2','xz'].includes(ext))return 'archive';
 if(ext==='pdf')return 'pdf';
 if(['doc','docx'].includes(ext))return 'word';
 if(['ppt','pptx'].includes(ext))return 'ppt';
 return 'generic';
}
function iconLabel(t){
 // Original inline SVG artwork: no CDN, font, or third-party asset dependency.
 const colors={folder:'#e4b957',text:'#8fb2d6',generic:'#91a4b8',code:'#788de7',archive:'#e0b04e',pdf:'#df6b73',word:'#5a9ee6',ppt:'#e28a59'};
 const c=colors[t]||colors.generic;
 const content={
 folder:'<path d="M3 7V5.5A2.5 2.5 0 0 1 5.5 3H10l2.2 2.4H20a2 2 0 0 1 2 2V18a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2Z" fill="currentColor" opacity=".85"/><path d="M3 9h19" stroke="#f8e0a4" stroke-width="1.3"/>',
 text:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor" opacity=".85"/><path d="M14 2.5V8h5" fill="none" stroke="#dceafa" stroke-width="1.5"/><path d="M8 12h8M8 15h8M8 18h5" stroke="#163049" stroke-width="1.35" stroke-linecap="round"/>',
 generic:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M14 2.5V8h5" fill="none" stroke="#e3ebf4" stroke-width="1.5"/>',
 code:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor" opacity=".86"/><path d="M14 2.5V8h5" fill="none" stroke="#e1e8ff" stroke-width="1.5"/><path d="m10 11-3 3 3 3m4-6 3 3-3 3" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
 archive:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M14 2.5V8h5" fill="none" stroke="#fff0ca" stroke-width="1.5"/><path d="M11 4v2m0 2v2m0 2v2" stroke="#634615" stroke-width="2"/><rect x="9" y="15" width="4" height="4" rx=".7" fill="#674914"/>',
 pdf:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M14 2.5V8h5" fill="none" stroke="#ffe1e4" stroke-width="1.5"/><text x="11.7" y="17.1" text-anchor="middle" font-size="6.3" font-family="Arial,sans-serif" font-weight="bold" fill="#fff">PDF</text>',
 word:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M14 2.5V8h5" fill="none" stroke="#dceeff" stroke-width="1.5"/><text x="11.7" y="18" text-anchor="middle" font-size="11" font-family="Arial,sans-serif" font-weight="bold" fill="#fff">W</text>',
 ppt:'<path d="M6 2.5h8l5 5V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M14 2.5V8h5" fill="none" stroke="#ffe6d6" stroke-width="1.5"/><text x="11.7" y="18" text-anchor="middle" font-size="11" font-family="Arial,sans-serif" font-weight="bold" fill="#fff">P</text>'
 };
 return `<svg class="dy-fm-file-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="color:${c}">${content[t]||content.generic}</svg>`;
}

function render(){
 if(!active)return;visibleObserver?.disconnect();visibleObserver=null;let host=$('#dy-file-manager');if(!host)return;
 const q=query.trim().toLocaleLowerCase();
 const visible=visibleEntries().filter(x=>(viewFolder?x.parent===viewFolder:!x.parent)&&(!q||[x.name,pathFor(x),x.localPath||'',...(x.tags||[])].join(' ').toLocaleLowerCase().includes(q)));
 const list=q?visibleEntries().filter(x=>[x.name,pathFor(x),x.localPath||'',...(x.tags||[])].join(' ').toLocaleLowerCase().includes(q)):visible;
 const folder=items.find(x=>x.id===viewFolder);
 host.innerHTML=`<section class="dy-fm">
  <header class="dy-fm-heading"><div><h3>文件管家</h3><small>本地索引 · 不儲存檔案內容 · 雲端僅同步索引資料</small><small class="dy-fm-device">對應裝置：${esc(deviceLabel())} · ${esc(THIS_DEVICE)}</small></div><div class="dy-fm-actions"><button data-fm="path-panel" aria-expanded="${pathPanel}">+Path</button><button type="button" class="dy-fm-explorer" data-fm="browse-native" title="開啟系統檔案選擇器以查找檔案或資料夾（瀏覽器無法取得 Windows 絕對路徑）">▣ 開啟檔案總管</button></div></header>
  ${pathPanel?`<form class="dy-fm-path-panel" id="dy-fm-path-form"><div><strong>+Path · 純路徑索引</strong><small>只儲存路徑文字，不讀取或授權實體檔案；可選 File 或 Fold。</small></div><label>類型<select name="kind"><option value="file">File</option><option value="directory">Fold</option></select></label><label>名稱<input name="name" maxlength="500" required placeholder="例如 main.cpp"></label><label>本地路徑<input name="localPath" maxlength="2000" required placeholder="例如 C:\\Work\\main.cpp"></label><button type="submit">新增索引</button><button type="button" data-fm="path-close">取消</button></form>`:''}
  <p class="dy-fm-cloud" aria-live="polite">${esc(cloudMessage)}</p><label class="dy-fm-search">⌕ <input id="dy-fm-search" type="search" placeholder="搜尋文件名稱、路徑或標籤" value="${esc(query)}" autocomplete="off"></label>
  <div class="dy-fm-crumb"><button data-fm="home">全部索引</button>${folder?' / '+esc(folder.name):''}<div class="dy-fm-compact-select"><label class="dy-fm-select-all-label" title="全選／取消全選目前結果"><input type="checkbox" id="dy-fm-select-all" ${list.length>0&&list.every(e=>selectedIds.has(e.id))?'checked':''} ${list.length===0?'disabled':''} aria-label="全選目前結果"><span>全選</span></label>${list.some(e=>selectedIds.has(e.id))?`<span class="dy-fm-selected-count" role="status">已選 ${list.filter(e=>selectedIds.has(e.id)).length} 項</span><button type="button" class="dy-fm-bulk-delete" data-fm="bulk-remove" title="批量移除已選索引（不刪除實體文件）">移除</button><button type="button" class="dy-fm-clear-selection" data-fm="clear-selection" title="取消所有選取" aria-label="取消所有選取">×</button>`:`<span class="dy-fm-total-count">${list.length} 項</span>`}</div></div>
  <div class="dy-fm-grid">${list.slice(0,renderLimit).map(e=>`<article class="dy-fm-item" data-id="${esc(e.id)}" tabindex="0" title="${esc(e.localPath||pathFor(e))}"><label class="dy-fm-select" title="選取索引"><input type="checkbox" data-fm-select="${esc(e.id)}" ${selectedIds.has(e.id)?'checked':''} aria-label="選取 ${esc(e.name)}"></label><div class="dy-fm-icon dy-fm-type-${iconType(e)}" aria-label="${iconType(e)}">${iconLabel(iconType(e))}</div>${editingId===e.id?`<form class="dy-fm-inline" data-id="${esc(e.id)}"><label>File name<input name="name" maxlength="500" required value="${esc(e.name)}"></label><label>Path（手動備註）<input name="localPath" maxlength="2000" value="${esc(e.localPath||'')}"></label><div class="dy-fm-inline-actions"><button type="submit">儲存</button><button type="button" data-fm="cancel-edit" data-id="${esc(e.id)}">取消</button></div></form>`:`<strong>${esc(e.name)}</strong><small>${esc(e.localPath||pathFor(e))}</small>`}<div class="dy-fm-controls"><button type="button" class="dy-fm-more" data-fm="menu" data-id="${esc(e.id)}" aria-label="${esc(e.name)} 操作選單" aria-haspopup="menu" aria-expanded="${menuId===e.id?'true':'false'}">···</button></div></article>`).join('')||'<p class="dy-fm-empty">尚無索引。按「+Path」新增文件或資料夾路徑。</p>'}</div>${list.length>renderLimit?`<div class="dy-fm-load-more" data-fm-more><button data-fm="show-more">顯示更多（${list.length-renderLimit} 項）</button></div>`:''}
  <p class="dy-fm-foot">雙擊資料夾可在網頁內查看其索引；雙擊文件可在授權後預覽或下載。瀏覽器無法直接開啟 Windows 檔案總管定位。</p>
  <input type="file" id="dy-fm-import" accept=".json,application/json" hidden>
  ${menuId&&items.some(e=>e.id===menuId)?`<div class="dy-fm-menu" role="menu" aria-label="文件操作"><button type="button" role="menuitem" data-fm="edit" data-id="${esc(menuId)}">編輯</button><button type="button" role="menuitem" data-fm="copy-path" data-id="${esc(menuId)}">複製本地路徑</button><button type="button" role="menuitem" data-fm="remove" data-id="${esc(menuId)}">移除</button><button type="button" role="menuitem" data-fm="close-menu">取消</button></div>`:''}
 </section>`;
 positionMenu();
 const sentinel=$('#dy-file-manager [data-fm-more]');if(sentinel&&'IntersectionObserver' in window){visibleObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){renderLimit+=60;render()}},{rootMargin:'250px'});visibleObserver.observe(sentinel)}
}
function positionMenu(){
 const menu=$('#dy-file-manager .dy-fm-menu');if(!menu||!menuId)return;
 const anchor=$(`#dy-file-manager .dy-fm-more[data-id="${CSS.escape(menuId)}"]`);
 const rect=anchor?.getBoundingClientRect();
 const x=menuPoint?.x??rect?.right??12,y=menuPoint?.y??rect?.bottom??12;
 const w=menu.offsetWidth||170,h=menu.offsetHeight||160;
 menu.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';
 menu.style.top=Math.max(8,Math.min(y,innerHeight-h-8))+'px';
}
function showMenu(entryId,x=null,y=null){
 if(menuId===entryId&&x===null){menuId=null;menuPoint=null}else{menuId=entryId;menuPoint=x===null?null:{x,y}}
 render();
}
async function copyPath(entry){
 const path=String(entry.localPath||'').trim();
 if(!path){cloudMessage='此文件尚未記錄本地路徑；請先使用「編輯」填寫 Path。';render();return}
 try{await navigator.clipboard.writeText(path);cloudMessage='已複製本地路徑';}
 catch(err){cloudMessage='複製失敗：請確認瀏覽器剪貼簿權限（需 localhost 或 HTTPS）';}
 render();
}
async function open(e){
 if(e.kind==='directory'){viewFolder=e.id;renderLimit=60;selectedIds.clear();render();return}
 if(!await access(e))return;
 try{
  const file=await e.handle.getFile();
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.download=file.name;
  a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(err){alert('文件可能已移動或刪除，請重新指定路徑：'+err.message)}
}
async function bulkRemove(){
 const scope=visibleEntries().filter(e=>selectedIds.has(e.id));if(!scope.length)return;
 const removeIds=new Set(scope.map(e=>e.id));let changed=true;while(changed){changed=false;for(const e of items){if(e.parent&&removeIds.has(e.parent)&&!removeIds.has(e.id)){removeIds.add(e.id);changed=true}}}
 if(!confirm(`確定批量移除 ${removeIds.size} 筆索引？不會刪除實體文件。選取資料夾時，將一併移除其所有子項目索引。`))return;
 busy=true;try{for(const key of removeIds)await del(key);selectedIds.clear();cloudMessage=`已移除 ${removeIds.size} 筆本機索引（尚未 Save 至雲端）`;await reload()}finally{busy=false}
}
async function savePath(form){
 const name=String(form.elements.name.value||'').trim(),localPath=String(form.elements.localPath.value||'').trim(),kind=form.elements.kind.value;
 if(!name||name.length>500||!localPath||localPath.length>2000||!['file','directory'].includes(kind))return;
 if(items.length>=2000){cloudMessage='索引已達 2000 項上限';render();return}
 await put({id:id(),name,kind,parent:viewFolder||null,relativePath:name,localPath,tags:[],virtual:false,pathOnly:true,device:THIS_DEVICE,createdAt:new Date().toISOString()});pathPanel=false;cloudMessage='已新增純路徑索引（無檔案存取權限）';await reload();
}
async function saveInline(form){
 const e=items.find(x=>x.id===form.dataset.id);if(!e)return;
 const name=String(form.elements.name.value||'').trim();const localPath=String(form.elements.localPath.value||'').trim();
 if(!name||name.length>500||localPath.length>2000){alert('名稱或路徑長度不合法');return}
 await put({...e,name,localPath});editingId=null;await reload();
}
async function exportIndex(){
 const safe=items.map(({handle,...meta})=>meta);
 const u=URL.createObjectURL(new Blob([JSON.stringify({schema:1,entries:safe},null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=u;a.download='BV-DIARY-file-index.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);
}
async function importIndex(file){
 try{
  const data=JSON.parse(await file.text());
  if(data.schema!==1||!Array.isArray(data.entries)||data.entries.length>10000)throw Error('索引格式不正確');
  if(!confirm(`匯入 ${data.entries.length} 筆索引？同 ID 將覆蓋本地記錄；匯入不包含檔案授權。`))return;
  for(const v of data.entries){
   if(!v||typeof v.id!=='string'||typeof v.name!=='string'||!['file','directory'].includes(v.kind))continue;
   const old=items.find(x=>x.id===v.id);
   await put({id:v.id,name:v.name.slice(0,500),kind:v.kind,parent:typeof v.parent==='string'?v.parent:null,relativePath:String(v.relativePath||v.name).slice(0,2000),localPath:String(v.localPath||'').slice(0,2000),tags:Array.isArray(v.tags)?v.tags.filter(x=>typeof x==='string').slice(0,30):[],device:String(v.device||''),createdAt:String(v.createdAt||''),...(old?.handle?{handle:old.handle}:{})});
  }
  await reload();
 }catch(err){alert('匯入失敗：'+err.message)}
}
// Cloud API is separate from diary transactions; no file content or FileSystemHandle is uploaded.
function cloudUrl(){const base=String(window.BV_CLOUD_API_URL||'').replace(/\/+$/,'');if(!/^https:\/\//.test(base))throw Error('未設定 BV_CLOUD_API_URL');return base+'/api/diary/files'}
function authToken(){const token=window.BVAuth?.getToken?.();if(!token)throw Error('請先登入 BV-NOTE');return token}
async function cloudRequest(method,body){const response=await fetch(cloudUrl(),{method,headers:{Authorization:'Bearer '+authToken(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});let result=await response.json().catch(()=>({}));if(!response.ok){const err=Error(result.error||('HTTP '+response.status));err.status=response.status;throw err}return result}
function metadata(e){return {id:e.id,name:e.name,kind:e.kind,parent:e.parent||null,relativePath:e.relativePath||e.name,localPath:e.localPath||'',tags:e.tags||[],virtual:!!e.virtual,device:e.device||'',createdAt:e.createdAt||''}}
async function cloudLoad(){if(busy)return;busy=true;cloudMessage='正在載入雲端索引…';render();try{
 const remote=await cloudRequest('GET');
 if(!remote.exists){cloudRevision=0;cloudKnown=true;cloudMessage='雲端尚無索引；可按「雲端存儲」建立';return}
 if(!confirm(`將雲端 ${remote.entries.length} 筆索引載入本機？同 ID 索引將以雲端為準，本機其他索引仍保留。`))return;
 const local=await all();const byId=new Map(local.map(e=>[e.id,e]));
 for(const meta of remote.entries){const old=byId.get(meta.id);await put({...meta,...(old?.handle&&meta.device===THIS_DEVICE?{handle:old.handle}:{})});}
 cloudRevision=remote.revision;cloudKnown=true;cloudMessage=`已載入雲端版本 ${cloudRevision}；本機額外索引尚未上傳`;await reload();
 }catch(err){cloudMessage='載入失敗：'+err.message;alert(cloudMessage)}finally{busy=false;render()}}
async function cloudSave(){if(busy)return;busy=true;cloudMessage='正在檢查雲端版本…';render();try{
 const remote=await cloudRequest('GET');
 if(cloudKnown&&cloudRevision!==remote.revision)throw Error('雲端已被其他裝置更新，請先 Load 再存儲');
 const localScope=items.filter(own).map(metadata);
 const remoteScope=remote.entries.filter(own);
 // Never overwrite entries owned by other devices; they remain in the cloud document.
 const otherDevices=remote.entries.filter(e=>e.device&&e.device!==THIS_DEVICE);
 const entries=[...otherDevices,...localScope];
 if(localScope.length===0&&remoteScope.length>0){
  if(!confirm(`⚠️ 第一次確認：此裝置的本機索引為空，雲端對應範圍有 ${remoteScope.length} 筆資料。確定準備清空？`))return;
  if(!confirm('⚠️ 第二次確認：將清空此裝置的文件索引與雲端虛擬資料夾；其他裝置的文件記錄會保留。確定繼續？'))return;
 }else if(!cloudKnown&&remoteScope.length&&!confirm(`尚未 Load 雲端索引。確定以此裝置 ${localScope.length} 筆資料取代雲端對應範圍 ${remoteScope.length} 筆？其他裝置文件不受影響。`))return;
 const result=await cloudRequest('PUT',{baseRevision:remote.revision,entries});
 cloudRevision=result.revision;cloudKnown=true;cloudMessage=`已儲存雲端版本 ${cloudRevision}（此裝置 ${localScope.length} 筆；其他裝置文件保留）`;
 }catch(err){cloudMessage='存儲失敗：'+err.message;alert(cloudMessage)}finally{busy=false;render()}}
// Shared DIARY toolbar: one click starts DIARY's native cloud operation and the file index operation.
// Keep DIARY's original click listener intact. The two requests use distinct API endpoints.
document.addEventListener('click',ev=>{
 const button=ev.target.closest('#bv-diary #dy-cloud-load, #bv-diary #dy-save-as');
 if(!button)return;
 // A rapid second click is ignored by file manager while busy; DIARY owns its own busy guard.
 if(button.id==='dy-cloud-load')void cloudLoad();
 else void cloudSave();
},true);
// Capture DIARY tab navigation before diary.js handles it.  Its render() does
// not know the files tab and would otherwise overwrite this panel.
document.addEventListener('click',ev=>{
 const tab=ev.target.closest('#bv-diary .dy-tabs [data-tab]');
 if(!tab)return;
 if(tab.dataset.tab===TAB){
  ev.preventDefault();ev.stopImmediatePropagation();
  active=true;viewFolder=null;ensure();
 }else if(active){
  active=false; // Let the original DIARY tab handler render normally.
 }
},true);
document.addEventListener('click',async ev=>{
 if(!active)return;
 const btn=ev.target.closest('#dy-file-manager [data-fm]');if(!btn)return;
 const act=btn.dataset.fm;const entry=items.find(x=>x.id===btn.dataset.id);
 if(act==='browse-native'){
  // Browser security prevents launching an arbitrary Explorer window or reading its absolute path.
  // The OS picker is the closest secure browser-native alternative.
  try{
   const kind=$('#dy-fm-path-form select[name="kind"]')?.value||'file';
   let pickedName='';
   if(kind==='directory'&&window.showDirectoryPicker){const handle=await window.showDirectoryPicker({mode:'read'});pickedName=handle.name;}
   else if(window.showOpenFilePicker){const handles=await window.showOpenFilePicker({multiple:false});pickedName=handles[0]?.name||'';}
   else {cloudMessage='此瀏覽器不支援系統選擇器；請手動填入路徑。';render();return;}
   if(!pickedName)return;
   pathPanel=true;render();
   const field=$('#dy-fm-path-form input[name="name"]');if(field&&!field.value)field.value=pickedName;
   cloudMessage='已選取「'+pickedName+'」。瀏覽器無法讀取 Windows 絕對路徑，請在 +Path 表單自行填寫。';
   const status=$('#dy-file-manager .dy-fm-cloud');if(status)status.textContent=cloudMessage;
  }catch(err){if(err.name!=='AbortError'){cloudMessage='開啟系統選擇器失敗：'+err.message;render();}}
  return;
 }
 if(act==='path-panel'){pathPanel=!pathPanel;render();return}
 if(act==='path-close'){pathPanel=false;render();return}
 if(act==='show-more'){renderLimit+=60;render();return}
 if(act==='clear-selection'){selectedIds.clear();render();return}
 if(act==='bulk-remove'){await bulkRemove();return}
 if(act==='menu'&&entry){showMenu(entry.id);return}
 if(act==='close-menu'){menuId=null;menuPoint=null;render();return}
 if(act==='copy-path'&&entry){menuId=null;menuPoint=null;await copyPath(entry);return}
 if(act==='home'){viewFolder=null;renderLimit=60;selectedIds.clear();render()}
 else if(act==='edit'&&entry){menuId=null;menuPoint=null;editingId=editingId===entry.id?null:entry.id;render();if(editingId)$('#dy-file-manager .dy-fm-inline input[name=name]')?.focus()}
 else if(act==='cancel-edit'){editingId=null;render()}
 else if(act==='remove'&&entry&&confirm(`移除「${entry.name}」索引？不會刪除實體文件。`)){await del(entry.id);await reload()}
 else if(act==='export')await exportIndex();
 else if(act==='import')$('#dy-fm-import')?.click();
});
document.addEventListener('contextmenu',ev=>{
 if(!active)return;
 const card=ev.target.closest('#dy-file-manager .dy-fm-item');
 if(!card||ev.target.closest('input,textarea,select'))return;
 ev.preventDefault();menuId=card.dataset.id;menuPoint={x:ev.clientX,y:ev.clientY};render();
});
document.addEventListener('pointerdown',ev=>{
 if(!active)return;
 if(menuId&&!ev.target.closest('#dy-file-manager .dy-fm-menu, #dy-file-manager .dy-fm-more')){
  menuId=null;menuPoint=null;
  // Do not re-render while a user is clicking an editor control.
  if(!ev.target.closest('#dy-file-manager .dy-fm-inline'))queueMicrotask(()=>render());
 }
 if(editingId&&!ev.target.closest(`#dy-file-manager .dy-fm-item[data-id="${CSS.escape(editingId)}"]`)){
  editingId=null;queueMicrotask(()=>render());
 }
},true);
document.addEventListener('keydown',ev=>{
 if(ev.key==='Escape'&&active&&(menuId||editingId)){
  menuId=null;menuPoint=null;editingId=null;render();ev.preventDefault();
 }
});
document.addEventListener('submit',async e=>{if(e.target.id==='dy-fm-path-form'){e.preventDefault();await savePath(e.target);return}const form=e.target.closest('#dy-file-manager .dy-fm-inline');if(!form)return;e.preventDefault();await saveInline(form)});
document.addEventListener('input',e=>{if(e.target.id==='dy-fm-search'){const pos=e.target.selectionStart;query=e.target.value;render();const field=$('#dy-fm-search');field?.focus();field?.setSelectionRange(pos,pos)}});
document.addEventListener('change',async e=>{if(e.target.matches('#dy-file-manager [data-fm-select]')){if(e.target.checked)selectedIds.add(e.target.dataset.fmSelect);else selectedIds.delete(e.target.dataset.fmSelect);render();return}if(e.target.id==='dy-fm-select-all'){const q=query.trim().toLocaleLowerCase();const scope=visibleEntries().filter(x=>(q?[x.name,pathFor(x),x.localPath||'',...(x.tags||[])].join(' ').toLocaleLowerCase().includes(q):(viewFolder?x.parent===viewFolder:!x.parent)));for(const x of scope){if(e.target.checked)selectedIds.add(x.id);else selectedIds.delete(x.id)}render();return}if(e.target.id==='dy-fm-import'&&e.target.files[0])await importIndex(e.target.files[0])});
document.addEventListener('dblclick',async e=>{if(!active)return;const el=e.target.closest('#dy-file-manager .dy-fm-item');if(!el||e.target.closest('button,input,form,label'))return;const v=items.find(x=>x.id===el.dataset.id);if(v)await open(v)});
document.addEventListener('keydown',async e=>{if(e.key!=='Enter'||!active)return;const el=e.target.closest('#dy-file-manager .dy-fm-item');if(el&&!e.target.closest('input,form,button')){const v=items.find(x=>x.id===el.dataset.id);if(v)await open(v)}});
const observer=new MutationObserver(()=>{const bar=tabBar();if(bar&&!bar.querySelector('[data-tab="files"]'))ensure()});
function init(){observer.observe(document.body,{childList:true,subtree:true});ensure();reload().catch(e=>console.warn('[DIARY File Manager]',e))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
