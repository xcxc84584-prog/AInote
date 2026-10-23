// AREA A08 START: CloudClient | File: cloud.js
'use strict';
(()=>{
const $=id=>document.getElementById(id),msg=t=>{$('cloud-message').textContent=t};
let page='editor',selectedCloud=null,files=[],lastSubmittedHash=null,lastSubmittedId=null,working=false,progressTimer=null;
const lifeOptions=[1,7,14,30,90];
const validId=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
function apiUrl(){const url=String(window.BV_CLOUD_API_URL||'').trim().replace(/\/+$/,'');if(!/^https:\/\//.test(url)||url.includes('REPLACE-WITH-YOUR-WORKER'))throw Error('請先設定 cloud-config.js 的 Worker URL');return url}
async function api(path,method='GET',data){const r=await fetch(apiUrl()+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(window.BVAuth?.getToken()?{Authorization:'Bearer '+window.BVAuth.getToken()}: {})},body:data?JSON.stringify(data):undefined});let body;try{body=await r.json()}catch{throw Error('API 回傳非 JSON')};if(!r.ok)throw Error(body.error||'HTTP '+r.status);return body}
function show(name){closeCloudMenu();page=name;document.body.classList.toggle('cloud-active',page==='cloud');$('cloud-page').hidden=page!=='cloud';$('cloud-header-tools').hidden=page!=='cloud';$('editor-header-tools').hidden=page==='cloud';$('cloud-page-toggle').setAttribute('aria-pressed',String(page==='cloud'))}window.BVShowPage=show;
$('cloud-page-toggle').onclick=()=>{const next=page==='cloud'?'editor':'cloud';show(next);if(next==='cloud'&&window.BVAuth?.getToken())$('cloud-search-button').click()};
$('cloud-back-editor-button').onclick=()=>show('editor');
function progress(percent,label){const wrap=$('cloud-progress');wrap.hidden=false;$('cloud-progress-bar').value=Math.max(0,Math.min(100,percent));$('cloud-progress-percent').textContent=Math.round(percent)+'%';$('cloud-progress-label').textContent=label}
async function run(fn){if(working)return;clearTimeout(progressTimer);working=true;progress(2,'準備操作…');try{await fn();progress(100,'操作完成')}catch(e){progress(0,'操作失敗');msg('錯誤：'+e.message);console.error(e)}finally{working=false;progressTimer=setTimeout(()=>{if(!working)$('cloud-progress').hidden=true},1600)}}
function life(){const v=Number($('cloud-life-days').value);if(!lifeOptions.includes(v))throw Error('保存期限無效');return v}
function showCreatePanel(){const p=$('cloud-create-panel');p.hidden=false;msg('請選擇雲端 Fold 保存期限後建立專案')}

function el(tag,text){const n=document.createElement(tag);n.textContent=text;return n}
function renderFiles(rows){const body=$('cloud-file-table').querySelector('tbody');body.replaceChildren();for(const f of rows){const tr=el('tr','');for(const val of [f.name,String(f.revision||0)])tr.append(el('td',val));const td=el('td','');for(const [title,cb] of [['歷史',()=>history(f.file_id)],['編輯',()=>editCloud(f.file_id)],['下載',()=>download(f.file_id)],['刪除',()=>removeFile(f.file_id)]]){const b=el('button',title);b.onclick=()=>run(cb);td.append(b)}tr.append(td);body.append(tr)}if(!rows.length){const tr=el('tr','');const td=el('td','目前帳號沒有有效的雲端文件。');td.colSpan=3;tr.append(td);body.append(tr)}}
function upsert(f){files=[...files.filter(x=>x.file_id!==f.file_id),f];renderFiles(files)}
$('cloud-search-button').onclick=()=>run(async()=>{const id=$('cloud-search-input').value.trim();if(!id){const listing=await api('/api/v378/files');files=listing.files;renderFiles(files);msg('已列出帳號名下 '+files.length+' 筆 Neon 分片文件');return}if(!validId(id))throw Error('只能使用完整 File Hash ID（UUID）搜尋');progress(35,'查詢雲端資料…');let f;try{f=await api('/api/v378/files/'+encodeURIComponent(id)+'/meta')}catch{f=await api('/api/files/'+encodeURIComponent(id)+'/meta')}upsert(f);selectedCloud=id;msg('找到專案：'+f.name)});
$('cloud-search-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('cloud-search-button').click()});
window.addEventListener('focus',()=>{if(page==='cloud'&&window.BVAuth?.getToken()&&!$('cloud-search-input').value.trim())$('cloud-search-button').click()});
// A page refresh performs one empty account search as soon as authentication is restored.
let initialSearchToken=null;const autoSearch=()=>{const token=window.BVAuth?.getToken();if(token&&token!==initialSearchToken){initialSearchToken=token;$('cloud-search-input').value='';$('cloud-search-button').click()}else if(!token)initialSearchToken=null};
window.addEventListener('load',autoSearch);window.addEventListener('bv-auth-changed',autoSearch);setTimeout(autoSearch,0);let autoSearchAttempts=0;const authReadyPoll=setInterval(()=>{autoSearch();if(initialSearchToken||++autoSearchAttempts>=60)clearInterval(authReadyPoll)},500);
async function history(id){selectedCloud=id;progress(25,'讀取提交歷史…');const result=await api('/api/v378/files/'+encodeURIComponent(id)+'/history');const panel=$('cloud-history');panel.replaceChildren();panel.append(el('h4',result.name+'｜'+id));for(const row of result.commits){const div=el('div',`#${row.revision} · ${row.created_at} · ${row.mode} · ${(row.sha256||'').slice(0,12)}… `);div.className='cloud-history-row';const b=el('button','下載此版本');b.onclick=()=>run(()=>download(id,row.revision));div.append(b);const del=el('button','刪除紀錄');del.className='cloud-delete-revision';del.disabled=result.commits.length<=1;del.title=del.disabled?'最後一筆提交不可單獨刪除':'';del.onclick=()=>run(async()=>{if(!confirm('永久刪除版本 #'+row.revision+'？無法復原。'))return;await api('/api/v378/files/'+id+'/history/'+row.revision,'DELETE');upsert(await api('/api/v378/files/'+id+'/meta'));await history(id);msg('已刪除版本 #'+row.revision)});div.append(del);panel.append(div)}if(!result.commits.length)panel.append(el('p','尚無提交紀錄'));msg('已載入提交歷史')}
function saveBlob(name,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
const bytesToBase64=bytes=>{let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary)};
const base64ToBytes=str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
async function zipFolder(handle){progress(12,'正在掃描本地 Fold…');if(!window.JSZip)throw Error('JSZip 尚未載入');const zip=new JSZip();let count=0;async function walk(dir,prefix){for await(const [name,child] of dir.entries()){if(name==='filehashid.txt'||name==='.git'||name==='node_modules')continue;if(child.kind==='directory'){zip.file(prefix+name+'/',null,{dir:true,date:new Date('2000-01-01T00:00:00Z')});await walk(child,prefix+name+'/')}else{const file=await child.getFile();zip.file(prefix+name,await file.arrayBuffer(),{date:new Date('2000-01-01T00:00:00Z')});count++}}}await walk(handle,'');progress(35,'正在壓縮 ZIP…');const blob=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}},m=>progress(35+m.percent*.35,'壓縮 ZIP：'+Math.round(m.percent)+'%'));const data=bytesToBase64(blob);if(blob.byteLength>100*1024*1024)throw Error('ZIP 超過 100 MiB 上限');return {bytes:blob,content:data,count,hash:await crypto.subtle.digest('SHA-256',blob).then(a=>Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,'0')).join(''))}}
const shaBytes=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
async function zipManifest(zip){const out={};for(const [path,item] of Object.entries(zip.files)){if(item.dir)continue;out[path]=await shaBytes(await item.async('uint8array'))}return out}
async function localSnapshot(handle){const entries={};async function walk(dir,prefix){for await(const [name,child] of dir.entries()){if(name==='filehashid.txt'||name==='.git'||name==='node_modules')continue;const path=prefix+name;if(child.kind==='directory')await walk(child,path+'/');else{const bytes=new Uint8Array(await(await child.getFile()).arrayBuffer());entries[path]={hash:await shaBytes(bytes),bytes}}}}await walk(handle,'');return entries}
async function buildIncremental(handle,remoteContent){progress(15,'讀取雲端版本 Hash…');const baseline=await JSZip.loadAsync(base64ToBytes(remoteContent));const old=await zipManifest(baseline);progress(32,'比較本地檔案 SHA-256…');const now=await localSnapshot(handle);const changes={},deleted=[];for(const [path,item] of Object.entries(now))if(old[path]!==item.hash)changes[path]=bytesToBase64(item.bytes);for(const path of Object.keys(old))if(!now[path])deleted.push(path);return {changes,deleted,changedCount:Object.keys(changes).length,deletedCount:deleted.length,unchanged:Object.keys(changes).length===0&&deleted.length===0}}
async function readHashInfo(handle){try{const h=await handle.getFileHandle('filehashid.txt');const t=(await(await h.getFile()).text()).trim();try{const j=JSON.parse(t);return {id:j.file_hash_id||j.file_id||'',expires_at:j.expires_at||null,life_days:j.life_days||null}}catch{return {id:t,expires_at:null,life_days:null}}}catch(e){if(e.name==='NotFoundError')return {id:'',expires_at:null,life_days:null};throw e}}
async function readHashId(handle){return (await readHashInfo(handle)).id}

async function writeHashId(handle,id,lifeDays,expiresAt){const h=await handle.getFileHandle('filehashid.txt',{create:true});const w=await h.createWritable();await w.write(JSON.stringify({file_hash_id:id,life_days:lifeDays,expires_at:expiresAt},null,2)+'\n');await w.close()}
async function getCloud(id,rev){return api('/api/files/'+encodeURIComponent(id)+(rev?'?revision='+encodeURIComponent(rev):''))}
async function download(id,rev){
 progress(10,'讀取分片 ZIP…');
 if(!window.JSZip)throw Error('JSZip 尚未載入');
 // v3.8.0: do not convert the whole archive to base64; large files otherwise
 // require multiple simultaneous copies and can fail on browser memory limits.
 const {meta,bytes:original}=await getCloudArchive(id,rev);
 if(meta.file_id.toLowerCase()!==id.toLowerCase())throw Error('雲端回傳 File ID 不一致');
 const zip=await JSZip.loadAsync(original,{checkCRC32:true});
 if(zip.file('filehashid.txt'))throw Error('ZIP 已包含 filehashid.txt，為避免覆蓋而停止下載');
 const entries=[];
 for(const [path,item] of Object.entries(zip.files)){
  if(item.dir)continue;
  if(path.startsWith('/')||path.includes('\\')||path.split('/').some(x=>x==='..'||x==='.')||path.includes('\0'))throw Error('ZIP 路徑不安全');
  const data=await item.async('uint8array');
  entries.push({path,cloud_file_id:id,sha256:await shaBytes(data)});
 }
 entries.sort((a,b)=>a.path.localeCompare(b.path));
 const manifest={version:'1.0',hash_algorithm:'SHA-256',file_hash_id:id,cloud_file_id:id,revision:meta.revision,life_days:meta.life_days,expires_at:meta.expires_at,source_zip_sha256:meta.sha256,files:entries};
 zip.file('filehashid.txt',JSON.stringify(manifest,null,2)+'\n');
 progress(82,'封裝 ZIP 與識別檔…');
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}},m=>progress(82+m.percent*.17,'封裝 '+Math.round(m.percent)+'%'));
 const name=meta.name.endsWith('.zip')?meta.name:meta.name+'.zip';
 saveBlob(name,blob);msg('已下載完整 ZIP：'+name+'（Revision #'+meta.revision+'）');
}
async function removeFile(id){if(!confirm('永久刪除此雲端 ZIP 及所有 Commit 紀錄？不可復原。'))return;progress(35,'刪除雲端檔案…');await api('/api/v378/files/'+id,'DELETE');files=files.filter(f=>f.file_id!==id);if(selectedCloud===id){selectedCloud=null;$('cloud-history').textContent='雲端專案已刪除'}renderFiles(files);msg('雲端 ZIP 已刪除，本地 Fold 不受影響')}
$('cloud-create-button').onclick=()=>{try{window.BVCloudFolderHandle();showCreatePanel()}catch(e){msg('錯誤：'+e.message)}};
$('cloud-create-cancel').onclick=()=>{$('cloud-create-panel').hidden=true};
$('cloud-create-confirm').onclick=()=>run(async()=>{const folder=window.BVCloudFolderHandle(),days=life();const old=await readHashId(folder.handle);if(validId(old)&&!confirm('目前 Root 已有 filehashid.txt（'+old+'）。是否建立新的雲端專案並覆蓋原有 Hash ID？\n取消將保留原有檔案。'))return;const zip=await zipFolder(folder.handle);const id=crypto.randomUUID();progress(73,'建立雲端專案…');progress(83,'上傳 Fold ZIP…');const uploaded=await uploadChunked(id,folder.name+'.zip',zip.bytes,days);const created=await api('/api/v378/files/'+id+'/meta');progress(92,'保存 filehashid.txt…');try{await writeHashId(folder.handle,id,days,created.expires_at)}catch(e){throw Error('雲端建立成功，但寫入 filehashid.txt 失敗；請記錄 File Hash ID：'+id+'。'+e.message)}$('cloud-create-panel').hidden=true;selectedCloud=id;lastSubmittedId=id;lastSubmittedHash=zip.hash;updateCommitButton(true);upsert(await api('/api/v378/files/'+id+'/meta'));msg('雲端 Fold 已建立；保存 '+days+' 天，截止 '+created.expires_at+'；File Hash ID：'+id)});
function updateCommitButton(){const b=$('cloud-commit-button');if(!b)return;b.textContent='Commit';b.classList.add('cloud-commit-ready');b.classList.remove('cloud-commit-submitted');b.disabled=false}
$('cloud-commit-button').onclick=()=>run(async()=>{
 if(!window.BVCloudHasSelection?.())throw Error('請先選擇上傳文件');
 const snapshot=window.BVCloudExportVirtualRoot?await window.BVCloudExportVirtualRoot().catch(()=>null):null;
 if(snapshot){
  const meta=await api('/api/v378/files/'+snapshot.id+'/meta');
  if(!confirm('提交目前 IndexedDB Cloud Root 至 Revision #'+(meta.revision+1)+'？'))return;
  await commitDelta(snapshot,meta);
  const updated=await api('/api/v378/files/'+snapshot.id+'/meta');upsert(updated);selectedCloud=snapshot.id;
  msg('Cloud Root 增量提交成功，Revision #'+updated.revision+'；僅上傳變更分片');return;
 }
 const root=window.BVCloudRootHandle();const id=await readHashId(root.handle);
 if(!validId(id))throw Error('目前本地 Root 沒有有效的 filehashid.txt，請先建立雲端專案');
 const meta=await api('/api/v378/files/'+id+'/meta');
 $('cloud-commit-target').textContent='Root：'+root.name+'｜File Hash ID：'+id+'｜目前到期：'+(meta.expires_at||'未設定');
 // Chunked storage supports full snapshots; incremental mode is not compatible.
 const full=document.querySelector('input[name="cloud-commit-mode"][value="full"]');if(full)full.checked=true;
 document.querySelectorAll('input[name="cloud-commit-mode"]').forEach(x=>x.disabled=x.value!=='full');
 $('cloud-commit-life').hidden=false;$('cloud-commit-panel').hidden=false;
 msg('本地 Root：將以分片方式提交完整 ZIP');
});
document.querySelectorAll('input[name="cloud-commit-mode"]').forEach(x=>x.addEventListener('change',()=>{$('cloud-commit-life').hidden=document.querySelector('input[name="cloud-commit-mode"]:checked').value!=='full'}));
$('cloud-commit-cancel').onclick=()=>{$('cloud-commit-panel').hidden=true;msg('已取消提交')};
$('cloud-commit-confirm').onclick=()=>run(async()=>{
 const root=window.BVCloudRootHandle(),id=await readHashId(root.handle);
 if(!validId(id))throw Error('Root 缺少有效 File Hash ID');
 const meta=await api('/api/v378/files/'+id+'/meta');
 const zip=await zipFolder(root.handle);
 const days=Number($('cloud-commit-life-days').value);
 if(!lifeOptions.includes(days))throw Error('保存期限無效');
 await uploadChunked(id,meta.name,zip.bytes,days,meta.revision);
 const updated=await api('/api/v378/files/'+id+'/meta');
 await writeHashId(root.handle,id,updated.life_days,updated.expires_at);
 lastSubmittedId=id;lastSubmittedHash=zip.hash;updateCommitButton();
 $('cloud-commit-panel').hidden=true;upsert(updated);
 msg('本地 Root 提交成功，Revision #'+updated.revision);
});
const cloudMenu=$('cloud-operations'),cloudTrigger=$('cloud-other-button');function closeCloudMenu(){cloudMenu.hidden=true;cloudTrigger.setAttribute('aria-expanded','false')}function positionCloudMenu(){const r=cloudTrigger.getBoundingClientRect(),w=cloudMenu.offsetWidth||225,h=cloudMenu.offsetHeight||100,pad=8;cloudMenu.style.left=Math.max(pad,Math.min(window.innerWidth-w-pad,r.right-w))+'px';const below=r.bottom+6;cloudMenu.style.top=(below+h+pad<=window.innerHeight?below:Math.max(pad,r.top-h-6))+'px'}cloudTrigger.addEventListener('click',e=>{e.stopPropagation();if(!cloudMenu.hidden){closeCloudMenu();return}cloudMenu.hidden=false;cloudTrigger.setAttribute('aria-expanded','true');positionCloudMenu()});document.addEventListener('pointerdown',e=>{if(!cloudMenu.hidden&&!cloudMenu.contains(e.target)&&!cloudTrigger.contains(e.target))closeCloudMenu()});cloudMenu.addEventListener('click',e=>{if(e.target.closest('button'))closeCloudMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCloudMenu()});window.addEventListener('resize',()=>{if(!cloudMenu.hidden)positionCloudMenu()});window.addEventListener('scroll',()=>{if(!cloudMenu.hidden)positionCloudMenu()},true);
$('cloud-zip-button').onclick=()=>run(async()=>{if(!selectedCloud)throw Error('請先以 File Hash ID 搜尋');await download(selectedCloud)});
$('cloud-import-button').onclick=()=>run(async()=>{if(!selectedCloud)throw Error('請先以 File Hash ID 搜尋');await download(selectedCloud);msg('已下載 ZIP，請透過本地 Explorer 匯入；不會覆蓋本地檔案')});

async function rawApi(path,method,body,headers={}){const token=window.BVAuth?.getToken();if(!token)throw Error('請先登入帳號');const res=await fetch(apiUrl()+path,{method,headers:{Authorization:'Bearer '+token,...headers},body});if(!res.ok){const b=await res.json().catch(()=>({}));throw Error(b.error||'HTTP '+res.status)}return res}
async function uploadChunked(fileId,name,bytes,days,baseRevision){const hash=await shaBytes(bytes),key='bv378-upload-'+fileId+'-'+hash;let uploadId=localStorage.getItem(key);let start;try{start=await api('/api/v378/uploads','POST',{file_id:fileId,name,size_bytes:bytes.length,life_days:days,sha256:hash,...(baseRevision===undefined?{}:{base_revision:baseRevision}),...(uploadId?{upload_id:uploadId}:{})})}catch(e){if(uploadId){localStorage.removeItem(key);return uploadChunked(fileId,name,bytes,days)}throw e}uploadId=start.upload_id;localStorage.setItem(key,uploadId);const status=await api('/api/v378/uploads/'+uploadId);const done=new Set(status.received);for(let i=0;i<start.part_count;i++){if(done.has(i))continue;const chunkSize=Math.ceil(bytes.length/start.part_count)<=262144?262144:2097152,chunk=bytes.slice(i*chunkSize,(i+1)*chunkSize),digest=await shaBytes(chunk);for(let retry=0;;retry++){try{await rawApi('/api/v378/uploads/'+uploadId+'/'+i,'PUT',chunk,{'Content-Type':'application/octet-stream','X-BV-SHA256':digest});break}catch(e){if(retry>=2)throw e;await new Promise(r=>setTimeout(r,500*(retry+1)))}}progress(5+90*(i+1)/start.part_count,'上傳分片 '+(i+1)+' / '+start.part_count)}const result=await api('/api/v378/uploads/'+uploadId+'/complete','POST',{});localStorage.removeItem(key);return result}
async function getChunked(id,revision){const meta=await api('/api/v378/files/'+id+'/meta'+(revision?'?revision='+encodeURIComponent(revision):''));if(meta.size_bytes>100*1024*1024)throw Error('ZIP 超過 100 MiB');const data=new Uint8Array(meta.size_bytes);let offset=0;for(let i=0;i<meta.part_count;i++){const res=await rawApi('/api/v378/files/'+id+'/parts/'+i+(revision?'?revision='+encodeURIComponent(revision):''),'GET');const bytes=new Uint8Array(await res.arrayBuffer());if(await shaBytes(bytes)!==res.headers.get('X-BV-SHA256'))throw Error('分片驗證失敗');data.set(bytes,offset);offset+=bytes.length;progress(5+90*(i+1)/meta.part_count,'取得分片 '+(i+1)+' / '+meta.part_count)}if(offset!==data.length||await shaBytes(data)!==meta.sha256)throw Error('完整 ZIP 驗證失敗');return {meta,bytes:data}}
// v3.8.3: content-addressed incremental Cloud Root, SHA-256 verified on both directions.
const DELTA_SIZE=256*1024;
// Keep the proven 256 KiB Neon request size, but overlap three network requests.
async function parallelChunks(items,concurrency,task){
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{
  while(cursor<items.length){const i=cursor++;await task(items[i],i)}
 }));
}
async function commitDelta(snapshot,meta){
 const entries=[],payload=new Map();let total=0;
 for(const item of snapshot.entries){
  if(item.dir){entries.push({path:item.path,dir:true});continue}
  const data=item.data instanceof Uint8Array?item.data:new Uint8Array(item.data);
  total+=data.length;if(total>100*1024*1024)throw Error('Cloud Root 超過 100 MiB');
  const hashes=[];
  for(let off=0;off<data.length;off+=DELTA_SIZE){const bytes=data.slice(off,off+DELTA_SIZE),h=await shaBytes(bytes);hashes.push(h);if(!payload.has(h))payload.set(h,bytes)}
  entries.push({path:item.path,size:data.length,chunks:hashes});
 }
 if(entries.length>2000)throw Error('檔案數量超過 2000');
 const all=[...payload.keys()];let missing=[];
 for(let i=0;i<all.length;i+=500){const response=await api('/api/v383/chunks/missing','POST',{hashes:all.slice(i,i+500)});missing.push(...response.missing)}
 let uploaded=0;
 await parallelChunks(missing,3,async hash=>{
  for(let retry=0;;retry++){try{await rawApi('/api/v383/chunks/'+hash,'PUT',payload.get(hash),{'Content-Type':'application/octet-stream'});break}catch(e){if(retry>=2)throw e;await new Promise(r=>setTimeout(r,400*(retry+1)))}}
  uploaded++;progress(10+80*uploaded/Math.max(1,missing.length),'增量上傳 '+uploaded+' / '+missing.length);
 });
 const result=await api('/api/v383/files/'+snapshot.id+'/commit','POST',{base_revision:meta.revision,entries});
 msg('增量提交：'+missing.length+' 個新分片 / '+all.length+' 個不同分片');return result;
}
async function getCloudArchive(id,revision){
 let response;
 try{response=await api('/api/v383/files/'+id+'/manifest'+(revision?'?revision='+encodeURIComponent(revision):''))}
 catch(e){if(/不是增量格式/.test(e.message))return getChunked(id,revision);throw e}
 if(!window.JSZip)throw Error('JSZip 尚未載入');
 const zip=new JSZip();let total=0;
 const entries=response.manifest;
 if(!Array.isArray(entries)||entries.length>2000)throw Error('雲端增量目錄無效');
 const unique=[...new Set(entries.flatMap(e=>e.chunks||[]))],cache=new Map();
 let downloaded=0;
 await parallelChunks(unique,3,async hash=>{
  const r=await rawApi('/api/v383/chunks/'+hash,'GET');const bytes=new Uint8Array(await r.arrayBuffer());
  if(await shaBytes(bytes)!==hash)throw Error('增量分片 SHA-256 驗證失敗');cache.set(hash,bytes);
  downloaded++;progress(5+65*downloaded/Math.max(1,unique.length),'下載增量分片 '+downloaded+' / '+unique.length);
 });
 for(const e of entries){if(e.dir){zip.folder(e.path);continue}
  total+=e.size;if(total>100*1024*1024)throw Error('雲端檔案超過 100 MiB');
  const data=new Uint8Array(e.size);let offset=0;for(const hash of e.chunks){const part=cache.get(hash);if(!part||offset+part.length>data.length)throw Error('增量檔案資料損壞');data.set(part,offset);offset+=part.length}
  if(offset!==e.size)throw Error('增量檔案大小驗證失敗');zip.file(e.path,data)
 }
 const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}},m=>progress(70+m.percent*.28,'重建 ZIP '+Math.round(m.percent)+'%'));
 const meta=await api('/api/v378/files/'+id+'/meta').catch(()=>({file_id:id,name:response.name,revision:response.revision,life_days:1,expires_at:null}));
 return {meta:{...meta,revision:response.revision,sha256:await shaBytes(bytes)},bytes};
}
async function editCloud(id){const {meta,bytes}=await getCloudArchive(id);if(!window.JSZip)throw Error('JSZip 未載入');const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});const entries=[];let total=0;for(const [path,item] of Object.entries(zip.files)){if(item.dir){entries.push({path,dir:true});continue}if(path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>p==='..'||p==='.')||path.includes('\0'))throw Error('ZIP 含不安全路徑');const data=await item.async('uint8array');total+=data.length;if(total>1100*1024*1024||entries.length>=1000)throw Error('解壓縮大小或檔案數超過限制');entries.push({path,data})}const opened=await window.BVCloudOpenVirtualRoot?.(id,meta.name,entries);if(opened===false){msg('已取消雲端 Root REPLACE');return}show('editor');msg('已將完整雲端 ZIP 目錄載入 IndexedDB，不會寫入本地資料夾')}
renderFiles([]);
})();
// AREA A08 END: CloudClient
