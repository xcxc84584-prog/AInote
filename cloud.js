/* AREA A-92173C99 START: cloud.js */
// AREA A08 START: CloudClient | File: cloud.js
'use strict';
(()=>{/* BLOCK B-0538952312 START: AREA A-92173C99 */
const $=id=>document.getElementById(id),msg=t=>{/* BLOCK B-94BCA46384 START: AREA A-92173C99 */$('cloud-message').textContent=t/* BLOCK B-94BCA46384 END. */};
let page='editor',selectedCloud=null,files=[],lastSubmittedHash=null,lastSubmittedId=null,working=false,progressTimer=null;
const lifeOptions=[1,7,14,30,90];
const validId=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
function apiUrl(){/* BLOCK B-E99E3059B3 START: AREA A-92173C99 */const url=String(window.BV_CLOUD_API_URL||'').trim().replace(/\/+$/,'');if(!/^https:\/\//.test(url)||url.includes('REPLACE-WITH-YOUR-WORKER'))throw Error('請先設定 cloud-config.js 的 Worker URL');return url/* BLOCK B-E99E3059B3 END. */}
async function api(path,method='GET',data){/* BLOCK B-956A4C24EE START: AREA A-92173C99 */const r=await fetch(apiUrl()+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(window.BVAuth?.getToken()?{Authorization:'Bearer '+window.BVAuth.getToken()}: {})},body:data?JSON.stringify(data):undefined});let body;try{body=await r.json()}catch{throw Error('API 回傳非 JSON')};if(!r.ok)throw Error(body.error||'HTTP '+r.status);return body/* BLOCK B-956A4C24EE END. */}
function show(name){/* BLOCK B-506B8EBD76 START: AREA A-92173C99 */closeCloudMenu();page=name;document.body.classList.toggle('cloud-active',page==='cloud');$('cloud-page').hidden=page!=='cloud';$('cloud-header-tools').hidden=page!=='cloud';$('editor-header-tools').hidden=page==='cloud';$('cloud-page-toggle').setAttribute('aria-pressed',String(page==='cloud'))/* BLOCK B-506B8EBD76 END. */}window.BVShowPage=show;
$('cloud-page-toggle').onclick=()=>{/* BLOCK B-BEC2EC1039 START: AREA A-92173C99 */const next=page==='cloud'?'editor':'cloud';show(next);if(next==='cloud'&&window.BVAuth?.getToken())$('cloud-search-button').click()/* BLOCK B-BEC2EC1039 END. */};
$('cloud-back-editor-button').onclick=()=>show('editor');
function progress(percent,label){/* BLOCK B-9FA7114C33 START: AREA A-92173C99 */const wrap=$('cloud-progress');wrap.hidden=false;$('cloud-progress-bar').value=Math.max(0,Math.min(100,percent));$('cloud-progress-percent').textContent=Math.round(percent)+'%';$('cloud-progress-label').textContent=label/* BLOCK B-9FA7114C33 END. */}
async function run(fn){/* BLOCK B-0C4C3D8EF1 START: AREA A-92173C99 */if(working)return;clearTimeout(progressTimer);working=true;progress(2,'準備操作…');try{await fn();progress(100,'操作完成')}catch(e){progress(0,'操作失敗');msg('錯誤：'+e.message);console.error(e)}finally{working=false;progressTimer=setTimeout(()=>{/* BLOCK B-2D3B0705F0 START: AREA A-92173C99 */if(!working)$('cloud-progress').hidden=true/* BLOCK B-2D3B0705F0 END. */},1600)}/* BLOCK B-0C4C3D8EF1 END. */}
function life(){/* BLOCK B-9A09C5C3F8 START: AREA A-92173C99 */const v=Number($('cloud-life-days').value);if(!lifeOptions.includes(v))throw Error('保存期限無效');return v/* BLOCK B-9A09C5C3F8 END. */}
function showCreatePanel(){/* BLOCK B-0FA4625464 START: AREA A-92173C99 */const p=$('cloud-create-panel');p.hidden=false;msg('請選擇雲端 Fold 保存期限後建立專案')/* BLOCK B-0FA4625464 END. */}

function el(tag,text){/* BLOCK B-C49E6EED74 START: AREA A-92173C99 */const n=document.createElement(tag);n.textContent=text;return n/* BLOCK B-C49E6EED74 END. */}
function renderFiles(rows){/* BLOCK B-FB447ACCBB START: AREA A-92173C99 */const body=$('cloud-file-table').querySelector('tbody');body.replaceChildren();for(const f of rows){const tr=el('tr','');for(const val of [f.name,String(f.revision||0)])tr.append(el('td',val));const td=el('td','');for(const [title,cb] of [['歷史',()=>history(f.file_id)],['編輯',()=>editCloud(f.file_id)],['下載',()=>download(f.file_id)],['刪除',()=>removeFile(f.file_id)]]){const b=el('button',title);b.onclick=()=>run(cb);td.append(b)}tr.append(td);body.append(tr)}if(!rows.length){const tr=el('tr','');const td=el('td','目前帳號沒有有效的雲端文件。');td.colSpan=3;tr.append(td);body.append(tr)}/* BLOCK B-FB447ACCBB END. */}
function upsert(f){/* BLOCK B-4E30C734D8 START: AREA A-92173C99 */files=[...files.filter(x=>x.file_id!==f.file_id),f];renderFiles(files)/* BLOCK B-4E30C734D8 END. */}
$('cloud-search-button').onclick=()=>run(async()=>{/* BLOCK B-F555AA4E83 START: AREA A-92173C99 */const id=$('cloud-search-input').value.trim();if(!id){const listing=await api('/api/v378/files');files=listing.files;renderFiles(files);msg('已列出帳號名下 '+files.length+' 筆 Neon 分片文件');return}if(!validId(id))throw Error('只能使用完整 File Hash ID（UUID）搜尋');progress(35,'查詢雲端資料…');let f;try{f=await api('/api/v378/files/'+encodeURIComponent(id)+'/meta')}catch{f=await api('/api/files/'+encodeURIComponent(id)+'/meta')}upsert(f);selectedCloud=id;msg('找到專案：'+f.name)/* BLOCK B-F555AA4E83 END. */});
$('cloud-search-input').addEventListener('keydown',e=>{/* BLOCK B-0FAC26308F START: AREA A-92173C99 */if(e.key==='Enter')$('cloud-search-button').click()/* BLOCK B-0FAC26308F END. */});
window.addEventListener('focus',()=>{/* BLOCK B-CF94C4C855 START: AREA A-92173C99 */if(page==='cloud'&&window.BVAuth?.getToken()&&!$('cloud-search-input').value.trim())$('cloud-search-button').click()/* BLOCK B-CF94C4C855 END. */});
// A page refresh performs one empty account search as soon as authentication is restored.
let initialSearchToken=null;const autoSearch=()=>{/* BLOCK B-0C3A2490A8 START: AREA A-92173C99 */const token=window.BVAuth?.getToken();if(token&&token!==initialSearchToken){initialSearchToken=token;$('cloud-search-input').value='';$('cloud-search-button').click()}else if(!token)initialSearchToken=null/* BLOCK B-0C3A2490A8 END. */};
window.addEventListener('load',autoSearch);window.addEventListener('bv-auth-changed',autoSearch);setTimeout(autoSearch,0);let autoSearchAttempts=0;const authReadyPoll=setInterval(()=>{/* BLOCK B-A41B6A2FBB START: AREA A-92173C99 */autoSearch();if(initialSearchToken||++autoSearchAttempts>=60)clearInterval(authReadyPoll)/* BLOCK B-A41B6A2FBB END. */},500);
async function history(id){/* BLOCK B-A77AAA87D7 START: AREA A-92173C99 */selectedCloud=id;progress(25,'讀取提交歷史…');const result=await api('/api/v378/files/'+encodeURIComponent(id)+'/history');const panel=$('cloud-history');panel.replaceChildren();panel.append(el('h4',result.name+'｜'+id));for(const row of result.commits){const div=el('div',`#${row.revision} · ${row.created_at} · ${row.mode} · ${(row.sha256||'').slice(0,12)}… `);div.className='cloud-history-row';const b=el('button','下載此版本');b.onclick=()=>run(()=>download(id,row.revision));div.append(b);const del=el('button','刪除紀錄');del.className='cloud-delete-revision';del.disabled=result.commits.length<=1;del.title=del.disabled?'最後一筆提交不可單獨刪除':'';del.onclick=()=>run(async()=>{/* BLOCK B-EB27108C58 START: AREA A-92173C99 */if(!confirm('永久刪除版本 #'+row.revision+'？無法復原。'))return;await api('/api/v378/files/'+id+'/history/'+row.revision,'DELETE');upsert(await api('/api/v378/files/'+id+'/meta'));await history(id);msg('已刪除版本 #'+row.revision)/* BLOCK B-EB27108C58 END. */});div.append(del);panel.append(div)}if(!result.commits.length)panel.append(el('p','尚無提交紀錄'));msg('已載入提交歷史')/* BLOCK B-A77AAA87D7 END. */}
function saveBlob(name,blob){/* BLOCK B-3C6A986DFB START: AREA A-92173C99 */const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)/* BLOCK B-3C6A986DFB END. */}
const bytesToBase64=bytes=>{/* BLOCK B-CA4AF9FCAE START: AREA A-92173C99 */let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary)/* BLOCK B-CA4AF9FCAE END. */};
const base64ToBytes=str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
async function zipFolder(handle){/* BLOCK B-FBB2EA6F7E START: AREA A-92173C99 */progress(12,'正在掃描本地 Fold…');if(!window.JSZip)throw Error('JSZip 尚未載入');const zip=new JSZip();let count=0;async function walk(dir,prefix){/* BLOCK B-FFFE3D0C30 START: AREA A-92173C99 */for await(const [name,child] of dir.entries()){if(name==='filehashid.txt'||name==='.git'||name==='node_modules')continue;if(child.kind==='directory'){zip.file(prefix+name+'/',null,{dir:true,date:new Date('2000-01-01T00:00:00Z')});await walk(child,prefix+name+'/')}else{const file=await child.getFile();zip.file(prefix+name,await file.arrayBuffer(),{date:new Date('2000-01-01T00:00:00Z')});count++}}/* BLOCK B-FFFE3D0C30 END. */}await walk(handle,'');progress(35,'正在壓縮 ZIP…');const blob=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}},m=>progress(35+m.percent*.35,'壓縮 ZIP：'+Math.round(m.percent)+'%'));const data=bytesToBase64(blob);if(blob.byteLength>100*1024*1024)throw Error('ZIP 超過 100 MiB 上限');return {bytes:blob,content:data,count,hash:await crypto.subtle.digest('SHA-256',blob).then(a=>Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,'0')).join(''))}/* BLOCK B-FBB2EA6F7E END. */}
const shaBytes=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
async function zipManifest(zip){/* BLOCK B-C1C6031F8D START: AREA A-92173C99 */const out={};for(const [path,item] of Object.entries(zip.files)){if(item.dir)continue;out[path]=await shaBytes(await item.async('uint8array'))}return out/* BLOCK B-C1C6031F8D END. */}
async function localSnapshot(handle){/* BLOCK B-02094695E7 START: AREA A-92173C99 */const entries={};async function walk(dir,prefix){/* BLOCK B-3CCDF13D6E START: AREA A-92173C99 */for await(const [name,child] of dir.entries()){if(name==='filehashid.txt'||name==='.git'||name==='node_modules')continue;const path=prefix+name;if(child.kind==='directory')await walk(child,path+'/');else{const bytes=new Uint8Array(await(await child.getFile()).arrayBuffer());entries[path]={hash:await shaBytes(bytes),bytes}}}/* BLOCK B-3CCDF13D6E END. */}await walk(handle,'');return entries/* BLOCK B-02094695E7 END. */}
async function buildIncremental(handle,remoteContent){/* BLOCK B-0B94EF4F09 START: AREA A-92173C99 */progress(15,'讀取雲端版本 Hash…');const baseline=await JSZip.loadAsync(base64ToBytes(remoteContent));const old=await zipManifest(baseline);progress(32,'比較本地檔案 SHA-256…');const now=await localSnapshot(handle);const changes={},deleted=[];for(const [path,item] of Object.entries(now))if(old[path]!==item.hash)changes[path]=bytesToBase64(item.bytes);for(const path of Object.keys(old))if(!now[path])deleted.push(path);return {changes,deleted,changedCount:Object.keys(changes).length,deletedCount:deleted.length,unchanged:Object.keys(changes).length===0&&deleted.length===0}/* BLOCK B-0B94EF4F09 END. */}
async function readHashInfo(handle){/* BLOCK B-D320D7E967 START: AREA A-92173C99 */try{const h=await handle.getFileHandle('filehashid.txt');const t=(await(await h.getFile()).text()).trim();try{const j=JSON.parse(t);return {id:j.file_hash_id||j.file_id||'',expires_at:j.expires_at||null,life_days:j.life_days||null}}catch{return {id:t,expires_at:null,life_days:null}}}catch(e){if(e.name==='NotFoundError')return {id:'',expires_at:null,life_days:null};throw e}/* BLOCK B-D320D7E967 END. */}
async function readHashId(handle){/* BLOCK B-12CA210476 START: AREA A-92173C99 */return (await readHashInfo(handle)).id/* BLOCK B-12CA210476 END. */}

async function writeHashId(handle,id,lifeDays,expiresAt){/* BLOCK B-D1292809E5 START: AREA A-92173C99 */const h=await handle.getFileHandle('filehashid.txt',{create:true});const w=await h.createWritable();await w.write(JSON.stringify({file_hash_id:id,life_days:lifeDays,expires_at:expiresAt},null,2)+'\n');await w.close()/* BLOCK B-D1292809E5 END. */}
async function getCloud(id,rev){/* BLOCK B-1303AEEE2B START: AREA A-92173C99 */return api('/api/files/'+encodeURIComponent(id)+(rev?'?revision='+encodeURIComponent(rev):''))/* BLOCK B-1303AEEE2B END. */}
async function download(id,rev){/* BLOCK B-C5D3CD2A63 START: AREA A-92173C99 */
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
/* BLOCK B-C5D3CD2A63 END. */}
async function removeFile(id){/* BLOCK B-C9A81C76F9 START: AREA A-92173C99 */if(!confirm('永久刪除此雲端 ZIP 及所有 Commit 紀錄？不可復原。'))return;progress(35,'刪除雲端檔案…');await api('/api/v378/files/'+id,'DELETE');files=files.filter(f=>f.file_id!==id);if(selectedCloud===id){selectedCloud=null;$('cloud-history').textContent='雲端專案已刪除'}renderFiles(files);msg('雲端 ZIP 已刪除，本地 Fold 不受影響')/* BLOCK B-C9A81C76F9 END. */}
$('cloud-create-button').onclick=()=>{/* BLOCK B-6A9CFB9425 START: AREA A-92173C99 */try{window.BVCloudFolderHandle();showCreatePanel()}catch(e){msg('錯誤：'+e.message)}/* BLOCK B-6A9CFB9425 END. */};
$('cloud-create-cancel').onclick=()=>{/* BLOCK B-8512D08941 START: AREA A-92173C99 */$('cloud-create-panel').hidden=true/* BLOCK B-8512D08941 END. */};
$('cloud-create-confirm').onclick=()=>run(async()=>{/* BLOCK B-DF0B6A667F START: AREA A-92173C99 */const folder=window.BVCloudFolderHandle(),days=life();const old=await readHashId(folder.handle);if(validId(old)&&!confirm('目前 Root 已有 filehashid.txt（'+old+'）。是否建立新的雲端專案並覆蓋原有 Hash ID？\n取消將保留原有檔案。'))return;const zip=await zipFolder(folder.handle);const id=crypto.randomUUID();progress(73,'建立雲端專案…');progress(83,'上傳 Fold ZIP…');const uploaded=await uploadChunked(id,folder.name+'.zip',zip.bytes,days);const created=await api('/api/v378/files/'+id+'/meta');progress(92,'保存 filehashid.txt…');try{await writeHashId(folder.handle,id,days,created.expires_at)}catch(e){throw Error('雲端建立成功，但寫入 filehashid.txt 失敗；請記錄 File Hash ID：'+id+'。'+e.message)}$('cloud-create-panel').hidden=true;selectedCloud=id;lastSubmittedId=id;lastSubmittedHash=zip.hash;updateCommitButton(true);upsert(await api('/api/v378/files/'+id+'/meta'));msg('雲端 Fold 已建立；保存 '+days+' 天，截止 '+created.expires_at+'；File Hash ID：'+id)/* BLOCK B-DF0B6A667F END. */});
function updateCommitButton(){/* BLOCK B-0C84501AC3 START: AREA A-92173C99 */const b=$('cloud-commit-button');if(!b)return;b.textContent='Commit';b.classList.add('cloud-commit-ready');b.classList.remove('cloud-commit-submitted');b.disabled=false/* BLOCK B-0C84501AC3 END. */}
$('cloud-commit-button').onclick=()=>run(async()=>{/* BLOCK B-D7F487C745 START: AREA A-92173C99 */
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
/* BLOCK B-D7F487C745 END. */});
document.querySelectorAll('input[name="cloud-commit-mode"]').forEach(x=>x.addEventListener('change',()=>{/* BLOCK B-2A58141C1B START: AREA A-92173C99 */$('cloud-commit-life').hidden=document.querySelector('input[name="cloud-commit-mode"]:checked').value!=='full'/* BLOCK B-2A58141C1B END. */}));
$('cloud-commit-cancel').onclick=()=>{/* BLOCK B-6CC81BC787 START: AREA A-92173C99 */$('cloud-commit-panel').hidden=true;msg('已取消提交')/* BLOCK B-6CC81BC787 END. */};
$('cloud-commit-confirm').onclick=()=>run(async()=>{/* BLOCK B-6212A356C6 START: AREA A-92173C99 */
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
/* BLOCK B-6212A356C6 END. */});
const cloudMenu=$('cloud-operations'),cloudTrigger=$('cloud-other-button');function closeCloudMenu(){/* BLOCK B-1492515DE1 START: AREA A-92173C99 */cloudMenu.hidden=true;cloudTrigger.setAttribute('aria-expanded','false')/* BLOCK B-1492515DE1 END. */}function positionCloudMenu(){/* BLOCK B-9D515819CC START: AREA A-92173C99 */const r=cloudTrigger.getBoundingClientRect(),w=cloudMenu.offsetWidth||225,h=cloudMenu.offsetHeight||100,pad=8;cloudMenu.style.left=Math.max(pad,Math.min(window.innerWidth-w-pad,r.right-w))+'px';const below=r.bottom+6;cloudMenu.style.top=(below+h+pad<=window.innerHeight?below:Math.max(pad,r.top-h-6))+'px'/* BLOCK B-9D515819CC END. */}cloudTrigger.addEventListener('click',e=>{/* BLOCK B-E2EA6A97D1 START: AREA A-92173C99 */e.stopPropagation();if(!cloudMenu.hidden){closeCloudMenu();return}cloudMenu.hidden=false;cloudTrigger.setAttribute('aria-expanded','true');positionCloudMenu()/* BLOCK B-E2EA6A97D1 END. */});document.addEventListener('pointerdown',e=>{/* BLOCK B-47F3893F40 START: AREA A-92173C99 */if(!cloudMenu.hidden&&!cloudMenu.contains(e.target)&&!cloudTrigger.contains(e.target))closeCloudMenu()/* BLOCK B-47F3893F40 END. */});cloudMenu.addEventListener('click',e=>{/* BLOCK B-2E98C3589E START: AREA A-92173C99 */if(e.target.closest('button'))closeCloudMenu()/* BLOCK B-2E98C3589E END. */});document.addEventListener('keydown',e=>{/* BLOCK B-18AA16C25B START: AREA A-92173C99 */if(e.key==='Escape')closeCloudMenu()/* BLOCK B-18AA16C25B END. */});window.addEventListener('resize',()=>{/* BLOCK B-8B922A69EA START: AREA A-92173C99 */if(!cloudMenu.hidden)positionCloudMenu()/* BLOCK B-8B922A69EA END. */});window.addEventListener('scroll',()=>{/* BLOCK B-126C9012C7 START: AREA A-92173C99 */if(!cloudMenu.hidden)positionCloudMenu()/* BLOCK B-126C9012C7 END. */},true);
$('cloud-zip-button').onclick=()=>run(async()=>{/* BLOCK B-4D6ED6E16B START: AREA A-92173C99 */if(!selectedCloud)throw Error('請先以 File Hash ID 搜尋');await download(selectedCloud)/* BLOCK B-4D6ED6E16B END. */});
$('cloud-import-button').onclick=()=>run(async()=>{/* BLOCK B-A6D3355F9E START: AREA A-92173C99 */if(!selectedCloud)throw Error('請先以 File Hash ID 搜尋');await download(selectedCloud);msg('已下載 ZIP，請透過本地 Explorer 匯入；不會覆蓋本地檔案')/* BLOCK B-A6D3355F9E END. */});

async function rawApi(path,method,body,headers={}){/* BLOCK B-9F68BA37AE START: AREA A-92173C99 */const token=window.BVAuth?.getToken();if(!token)throw Error('請先登入帳號');const res=await fetch(apiUrl()+path,{method,headers:{Authorization:'Bearer '+token,...headers},body});if(!res.ok){const b=await res.json().catch(()=>({}));throw Error(b.error||'HTTP '+res.status)}return res/* BLOCK B-9F68BA37AE END. */}
// v3.8.6: retries preserve the upload ID and confirm server state before declaring failure.
const uploadPause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function uploadRetry(task,attempts=5){/* BLOCK B-8A1655B8A2 START: AREA A-92173C99 */let last;for(let n=0;n<attempts;n++){try{return await task()}catch(e){last=e;const code=Number(String(e.message).match(/HTTP (\d{3})/)?.[1]||0);if(code>=400&&code<500&&code!==408&&code!==409&&code!==429)throw e;if(n+1<attempts)await uploadPause(Math.min(10000,650*2**n)+Math.floor(Math.random()*350))}}throw last/* BLOCK B-8A1655B8A2 END. */}
async function uploadChunked(fileId,name,bytes,days,baseRevision){/* BLOCK B-F01BB43AA8 START: AREA A-92173C99 */
 const hash=await shaBytes(bytes),key='bv378-upload-'+fileId+'-'+hash;
 let uploadId=localStorage.getItem(key),start;
 const startBody=()=>({file_id:fileId,name,size_bytes:bytes.length,life_days:days,sha256:hash,...(baseRevision===undefined?{}:{base_revision:baseRevision}),...(uploadId?{upload_id:uploadId}:{})});
 try{start=await uploadRetry(()=>api('/api/v378/uploads','POST',startBody()))}
 catch(e){if(!uploadId)throw e;localStorage.removeItem(key);uploadId=null;start=await uploadRetry(()=>api('/api/v378/uploads','POST',startBody()))}
 uploadId=start.upload_id;localStorage.setItem(key,uploadId);
 let status=await uploadRetry(()=>api('/api/v378/uploads/'+uploadId));
 if(status.state==='complete'){localStorage.removeItem(key);return {ok:true,file_id:fileId,revision:start.revision}}
 const done=new Set(status.received||[]),chunkSize=Math.ceil(bytes.length/start.part_count)<=262144?262144:2097152;
 let uploaded=done.size;
 await parallelChunks(Array.from({length:start.part_count},(_,i)=>i).filter(i=>!done.has(i)),3,async i=>{/* BLOCK B-354E7F1DB3 START: AREA A-92173C99 */
  const chunk=bytes.slice(i*chunkSize,(i+1)*chunkSize),digest=await shaBytes(chunk);
  try{await uploadRetry(()=>rawApi('/api/v378/uploads/'+uploadId+'/'+i,'PUT',chunk,{'Content-Type':'application/octet-stream','X-BV-SHA256':digest}))}
  catch(e){const check=await uploadRetry(()=>api('/api/v378/uploads/'+uploadId)).catch(()=>null);if(!check?.received?.includes(i))throw e}
  uploaded++;progress(5+90*uploaded/start.part_count,'上傳分片 '+uploaded+' / '+start.part_count);
 /* BLOCK B-354E7F1DB3 END. */});
 // Completion can take longer than an individual part. Never discard the resumable ID on ambiguous failures.
 let lastError;
 for(let attempt=0;attempt<5;attempt++){
  try{const result=await api('/api/v378/uploads/'+uploadId+'/complete','POST',{});localStorage.removeItem(key);return result}
  catch(e){lastError=e;
   const check=await api('/api/v378/uploads/'+uploadId).catch(()=>null);
   if(check?.state==='complete'){localStorage.removeItem(key);return {ok:true,file_id:fileId,revision:start.revision}}
   if(check?.received?.length!==start.part_count&&check){throw Error('部分分片未保存，請重新提交以斷點續傳')}
   if(attempt<4)await uploadPause(Math.min(15000,1200*2**attempt)+Math.floor(Math.random()*400));
  }
 }
 throw Error('Complete 尚未確認成功；分片已保留，可再次提交續傳。'+(lastError?.message||''));
/* BLOCK B-F01BB43AA8 END. */}
async function getChunked(id,revision){/* BLOCK B-9732B4C3D2 START: AREA A-92173C99 */
 const meta=await api('/api/v378/files/'+id+'/meta'+(revision?'?revision='+encodeURIComponent(revision):''));
 if(meta.size_bytes>100*1024*1024)throw Error('ZIP 超過 100 MiB');
 const chunks=new Array(meta.part_count);let downloaded=0;
 await parallelChunks(Array.from({length:meta.part_count},(_,i)=>i),3,async i=>{/* BLOCK B-C330278073 START: AREA A-92173C99 */
  const res=await rawApi('/api/v378/files/'+id+'/parts/'+i+(revision?'?revision='+encodeURIComponent(revision):''),'GET');
  const part=new Uint8Array(await res.arrayBuffer());
  if(await shaBytes(part)!==res.headers.get('X-BV-SHA256'))throw Error('分片驗證失敗：'+i);
  chunks[i]=part;downloaded++;progress(5+90*downloaded/meta.part_count,'取得分片 '+downloaded+' / '+meta.part_count);
 /* BLOCK B-C330278073 END. */});
 const data=new Uint8Array(meta.size_bytes);let offset=0;
 for(const part of chunks){if(!part||offset+part.length>data.length)throw Error('ZIP 分片大小錯誤');data.set(part,offset);offset+=part.length}
 if(offset!==data.length||await shaBytes(data)!==meta.sha256)throw Error('完整 ZIP 驗證失敗');
 return {meta,bytes:data};
/* BLOCK B-9732B4C3D2 END. */}
// v3.8.3: content-addressed incremental Cloud Root, SHA-256 verified on both directions.
const DELTA_SIZE=256*1024;
// Keep the proven 256 KiB Neon request size, but overlap three network requests.
async function parallelChunks(items,concurrency,task){/* BLOCK B-351A546879 START: AREA A-92173C99 */
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{/* BLOCK B-93E0BB9892 START: AREA A-92173C99 */
  while(cursor<items.length){const i=cursor++;await task(items[i],i)}
 /* BLOCK B-93E0BB9892 END. */}));
/* BLOCK B-351A546879 END. */}
async function commitDelta(snapshot,meta){/* BLOCK B-6D033C3A40 START: AREA A-92173C99 */
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
 await parallelChunks(missing,3,async hash=>{/* BLOCK B-BDE1F8E670 START: AREA A-92173C99 */
  for(let retry=0;;retry++){try{await rawApi('/api/v383/chunks/'+hash,'PUT',payload.get(hash),{'Content-Type':'application/octet-stream'});break}catch(e){if(retry>=2)throw e;await new Promise(r=>setTimeout(r,400*(retry+1)))}}
  uploaded++;progress(10+80*uploaded/Math.max(1,missing.length),'增量上傳 '+uploaded+' / '+missing.length);
 /* BLOCK B-BDE1F8E670 END. */});
 const result=await api('/api/v383/files/'+snapshot.id+'/commit','POST',{base_revision:meta.revision,entries});
 msg('增量提交：'+missing.length+' 個新分片 / '+all.length+' 個不同分片');return result;
/* BLOCK B-6D033C3A40 END. */}
async function getCloudArchive(id,revision){/* BLOCK B-15750876FC START: AREA A-92173C99 */
 let response;
 try{response=await api('/api/v383/files/'+id+'/manifest'+(revision?'?revision='+encodeURIComponent(revision):''))}
 catch(e){if(/不是增量格式/.test(e.message))return getChunked(id,revision);throw e}
 if(!window.JSZip)throw Error('JSZip 尚未載入');
 const zip=new JSZip();let total=0;
 const entries=response.manifest;
 if(!Array.isArray(entries)||entries.length>2000)throw Error('雲端增量目錄無效');
 const unique=[...new Set(entries.flatMap(e=>e.chunks||[]))],cache=new Map();
 let downloaded=0;
 await parallelChunks(unique,3,async hash=>{/* BLOCK B-A2E9BF0897 START: AREA A-92173C99 */
  const r=await rawApi('/api/v383/chunks/'+hash,'GET');const bytes=new Uint8Array(await r.arrayBuffer());
  if(await shaBytes(bytes)!==hash)throw Error('增量分片 SHA-256 驗證失敗');cache.set(hash,bytes);
  downloaded++;progress(5+65*downloaded/Math.max(1,unique.length),'下載增量分片 '+downloaded+' / '+unique.length);
 /* BLOCK B-A2E9BF0897 END. */});
 for(const e of entries){if(e.dir){zip.folder(e.path);continue}
  total+=e.size;if(total>100*1024*1024)throw Error('雲端檔案超過 100 MiB');
  const data=new Uint8Array(e.size);let offset=0;for(const hash of e.chunks){const part=cache.get(hash);if(!part||offset+part.length>data.length)throw Error('增量檔案資料損壞');data.set(part,offset);offset+=part.length}
  if(offset!==e.size)throw Error('增量檔案大小驗證失敗');zip.file(e.path,data)
 }
 const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}},m=>progress(70+m.percent*.28,'重建 ZIP '+Math.round(m.percent)+'%'));
 const meta=await api('/api/v378/files/'+id+'/meta').catch(()=>({file_id:id,name:response.name,revision:response.revision,life_days:1,expires_at:null}));
 return {meta:{...meta,revision:response.revision,sha256:await shaBytes(bytes)},bytes};
/* BLOCK B-15750876FC END. */}
async function editCloud(id){/* BLOCK B-23118B012B START: AREA A-92173C99 */const {meta,bytes}=await getCloudArchive(id);if(!window.JSZip)throw Error('JSZip 未載入');const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});const entries=[];let total=0;for(const [path,item] of Object.entries(zip.files)){if(item.dir){entries.push({path,dir:true});continue}if(path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>p==='..'||p==='.')||path.includes('\0'))throw Error('ZIP 含不安全路徑');const data=await item.async('uint8array');total+=data.length;if(total>1100*1024*1024||entries.length>=1000)throw Error('解壓縮大小或檔案數超過限制');entries.push({path,data})}const opened=await window.BVCloudOpenVirtualRoot?.(id,meta.name,entries);if(opened===false){msg('已取消雲端 Root REPLACE');return}show('editor');msg('已將完整雲端 ZIP 目錄載入 IndexedDB，不會寫入本地資料夾')/* BLOCK B-23118B012B END. */}
renderFiles([]);
/* BLOCK B-0538952312 END. */})();
// AREA A08 END: CloudClient

/* AREA A-92173C99 END. */
