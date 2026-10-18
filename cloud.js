'use strict';
(()=>{
const $=id=>document.getElementById(id),msg=t=>{$('cloud-message').textContent=t};
let page='editor',selectedCloud=null,files=[];

const validId=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
function apiUrl(){const url=String(window.BV_CLOUD_API_URL||'').trim().replace(/\/+$/,'');if(!/^https:\/\//.test(url)||url.includes('REPLACE-WITH-YOUR-WORKER'))throw Error('網站尚未設定 Cloud API URL：請部署者編輯 cloud-config.js，填入 Cloudflare Worker HTTPS 網址');return url}
async function api(path,method='GET',data){const r=await fetch(apiUrl()+path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});let body;try{body=await r.json()}catch{throw Error('API 回傳非 JSON，請確認 Worker 網址')};if(!r.ok)throw Error(body.error||'HTTP '+r.status);return body}
function show(name){closeCloudMenu();page=name;document.body.classList.toggle('cloud-active',page==='cloud');$('cloud-page').hidden=page!=='cloud';$('cloud-header-tools').hidden=page!=='cloud';$('editor-header-tools').hidden=page==='cloud';$('cloud-page-toggle').setAttribute('aria-pressed',String(page==='cloud'))}window.BVShowPage=show;
$('cloud-page-toggle').onclick=()=>{const next=page==='cloud'?'editor':'cloud';show(next);if(next==='cloud'){try{apiUrl();msg('雲端 API 已由網站預先設定。輸入 File Hash ID 即可搜尋。')}catch(e){msg('設定提示：'+e.message)}}};
async function run(fn){try{msg('處理中…');await fn()}catch(e){msg('錯誤：'+e.message);console.error(e)}}
function el(tag,text){const n=document.createElement(tag);n.textContent=text;return n}
function renderFiles(rows){const body=$('cloud-file-table').querySelector('tbody');body.replaceChildren();for(const f of rows){const tr=document.createElement('tr');for(const val of [f.name,f.file_id,f.last_commit||'—',String(f.revision||0)])tr.append(el('td',val));const td=el('td','');for(const [title,cb] of [['歷史',()=>history(f.file_id)],['下載',()=>download(f.file_id)],['刪除',()=>removeFile(f.file_id)]]){const b=el('button',title);b.onclick=()=>run(cb);td.append(b)}tr.append(td);body.append(tr)}if(!rows.length){const tr=el('tr','');const td=el('td','請輸入完整 File Hash ID 搜尋；不提供雲端文件列表。');td.colSpan=5;tr.append(td);body.append(tr)}}
function upsert(f){files=[...files.filter(x=>x.file_id!==f.file_id),f];renderFiles(files)}
$('cloud-search-button').onclick=()=>run(async()=>{const id=$('cloud-search-input').value.trim();if(!validId(id))throw Error('只能使用完整 File Hash ID（UUID）搜尋');const f=await api('/api/files/'+encodeURIComponent(id)+'/meta');upsert(f);selectedCloud=id;msg('找到文件：'+f.name)});
$('cloud-search-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('cloud-search-button').click()});
async function history(id){selectedCloud=id;const result=await api('/api/files/'+encodeURIComponent(id)+'/history');const panel=$('cloud-history');panel.replaceChildren();panel.append(el('h4',result.name+'｜'+id));for(const row of result.commits){const div=el('div',`#${row.revision} · ${row.created_at} · ${row.mode} · ${row.sha256.slice(0,12)}… `);div.className='cloud-history-row';const b=el('button','下載此版本');b.onclick=()=>run(()=>download(id,row.revision));div.append(b);panel.append(div)}if(!result.commits.length)panel.append(el('p','尚無提交紀錄'));msg('已載入提交歷史')}
function saveBlob(name,bytes,mime){const blob=new Blob([bytes],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function getCloud(id,rev){return api('/api/files/'+encodeURIComponent(id)+(rev?'?revision='+encodeURIComponent(rev):''))}
async function download(id,rev){const f=await getCloud(id,rev);saveBlob(f.name,new TextEncoder().encode(f.content),'text/plain;charset=utf-8');msg('已下載：'+f.name)}
async function removeFile(id){if(!confirm('警告：擁有 File Hash ID 的任何人都能刪除。確定永久刪除此雲端文件及所有 Commit 紀錄？此操作無法還原。'))return;await api('/api/files/'+encodeURIComponent(id),'DELETE');files=files.filter(f=>f.file_id!==id);if(selectedCloud===id){selectedCloud=null;$('cloud-history').textContent='文件已刪除'}renderFiles(files);msg('雲端文件及其 Commit 紀錄已刪除（本地文件不受影響）')}
$('cloud-create-button').onclick=()=>run(async()=>{const local=await window.BVCloudLocalSelection();if(local.unsaved)throw Error('本地文件尚未保存，請先 Commit 本地文件');if(!validId(local.id))throw Error('本地文件沒有有效 UUID');if(!confirm('建立雲端專案並上傳「'+local.name+'」？\nFile Hash ID 持有者可讀取、提交及永久刪除該文件，請勿公開分享 ID。'))return;const result=await api('/api/projects','POST',{name:local.rootName});await api('/api/files','POST',{project_id:result.project_id,file_id:local.id,name:local.name,content:local.text});const f=await api('/api/files/'+encodeURIComponent(local.id)+'/meta');upsert(f);selectedCloud=local.id;msg('建立成功！請妥善保存 File Hash ID：'+local.id)});
$('cloud-commit-button').onclick=()=>run(async()=>{const local=await window.BVCloudLocalSelection();if(local.unsaved)throw Error('請先保存本地文件');if(!validId(local.id))throw Error('本地文件 ID 無效');const remote=await api('/api/files/'+encodeURIComponent(local.id)+'/meta');const mode=confirm('確定進行完整更新？\n確定：完整更新；取消：僅內容變更時提交')?'full':'incremental';const result=await api('/api/files/'+encodeURIComponent(local.id)+'/commit','POST',{name:local.name,content:local.text,base_revision:remote.revision,mode});upsert(await api('/api/files/'+encodeURIComponent(local.id)+'/meta'));msg(result.unchanged?'內容未變更':'Commit 成功，版本 #'+result.revision)});
// Same floating dropdown behavior as the editor Settings menu.
const cloudMenu=$('cloud-operations'),cloudTrigger=$('cloud-other-button');
function closeCloudMenu(){cloudMenu.hidden=true;cloudTrigger.setAttribute('aria-expanded','false')}
function positionCloudMenu(){
 const r=cloudTrigger.getBoundingClientRect(),w=cloudMenu.offsetWidth||225,h=cloudMenu.offsetHeight||100,pad=8;
 cloudMenu.style.left=Math.max(pad,Math.min(window.innerWidth-w-pad,r.right-w))+'px';
 const below=r.bottom+6;
 cloudMenu.style.top=(below+h+pad<=window.innerHeight?below:Math.max(pad,r.top-h-6))+'px';
}
cloudTrigger.addEventListener('click',e=>{e.stopPropagation();if(!cloudMenu.hidden){closeCloudMenu();return}cloudMenu.hidden=false;cloudTrigger.setAttribute('aria-expanded','true');positionCloudMenu()});
document.addEventListener('pointerdown',e=>{if(!cloudMenu.hidden&&!cloudMenu.contains(e.target)&&!cloudTrigger.contains(e.target))closeCloudMenu()});
cloudMenu.addEventListener('click',e=>{if(e.target.closest('button'))closeCloudMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCloudMenu()});
window.addEventListener('resize',()=>{if(!cloudMenu.hidden)positionCloudMenu()});
window.addEventListener('scroll',()=>{if(!cloudMenu.hidden)positionCloudMenu()},true);
$('cloud-zip-button').onclick=()=>run(async()=>{if(!selectedCloud)throw Error('請先以 File Hash ID 搜尋並選取文件');if(!window.JSZip)throw Error('ZIP 模組未載入');const f=await getCloud(selectedCloud);const zip=new JSZip();zip.file(f.name.replace(/[\\/]/g,'_'),f.content);const blob=await zip.generateAsync({type:'blob'});saveBlob('BV-Note-'+selectedCloud+'.zip',blob,'application/zip');msg('已下載單檔 ZIP（不會列出同專案其他文件）')});
$('cloud-import-button').onclick=()=>run(async()=>{if(!selectedCloud)throw Error('請先以 File Hash ID 搜尋文件');const f=await getCloud(selectedCloud);if(!confirm('將「'+f.name+'」以新文件匯入本地 Explorer Root？不會覆蓋同名文件。'))return;const name=await window.BVCloudImportText(f.name,f.content);msg('已匯入本地 Root：'+name)});
renderFiles([]);
})();
