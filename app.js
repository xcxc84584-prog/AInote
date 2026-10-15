'use strict';
const editor=document.querySelector('#editor'),statusEl=document.querySelector('#status'),filenameEl=document.querySelector('#filename'),input=document.querySelector('#file');
let handle=null,name='未命名.ainote',dirty=false;
editor.spellcheck=false;
editor.setAttribute('data-gramm','false');
editor.setAttribute('data-gramm_editor','false');
function status(s){statusEl.textContent=s}function setName(s){name=s;filenameEl.textContent=s}function changed(){dirty=true;status('尚未儲存')}
const escapedNewlines=t=>!t.includes('\n')&&(t.match(/\\n/g)||[]).length>=2?t.replace(/\\r\\n|\\n|\\r/g,'\n'):t.replace(/\r\n?/g,'\n');
// Convert external KaTeX HTML to a single recoverable TeX source before sanitizing.
// ChatGPT clipboard may include KaTeX's visual HTML plus its accessibility MathML.
function normalizePastedMath(html){
 const t=document.createElement('template');t.innerHTML=html;
 t.content.querySelectorAll('.katex-display, .katex').forEach(el=>{
  if(!el.isConnected)return;
  if(el.classList.contains('katex') && el.closest('.katex-display'))return;
  const display=el.classList.contains('katex-display');
  const annotation=el.querySelector('annotation[encoding="application/x-tex"]');
  const tex=annotation?.textContent?.trim();
  if(!tex)return;
  const raw=display?'$$'+tex+'$$':'\\('+tex+'\\)';
  const holder=document.createElement(display?'div':'span');
  holder.className='math-source';holder.dataset.tex=raw;holder.textContent=raw;
  el.replaceWith(holder);
 });
 return t.innerHTML;
}
function safeHTML(html){
 const t=document.createElement('template');t.innerHTML=normalizePastedMath(html);
 t.content.querySelectorAll('script,iframe,object,embed,style,link,meta,form').forEach(x=>x.remove());
 t.content.querySelectorAll('*').forEach(el=>{const svg=!!el.closest('svg');for(const a of [...el.attributes]){
  const n=a.name.toLowerCase(),v=a.value.trim();if(n.startsWith('on')||n==='style'||n==='color'||n==='bgcolor'||n==='class'&& !['math-source','math-rendered'].includes(v)||['href','src','xlink:href'].includes(n)&&!(/^(https?:\/\/|data:image\/(png|jpeg|gif|webp|svg\+xml)(?:;charset=[^;,]+)?(?:;base64)?,|#)/i.test(v)))el.removeAttribute(a.name);
 }if(!svg&&el.tagName==='FONT')el.removeAttribute('face')});return t.innerHTML;
}
function renderLooseMath(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode()){
  const n=walker.currentNode;
  if(n.parentElement?.closest('pre,code,svg,math,.katex,.math-rendered,.math-source'))continue;
  if(/\$[^$\n]+\$|\\\(|\\\[/.test(n.textContent))nodes.push(n);
 }
 for(const n of nodes){
  const re=/(\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
  const f=document.createDocumentFragment();let last=0,m,hit=false;
  while((m=re.exec(n.textContent))){hit=true;f.append(document.createTextNode(n.textContent.slice(last,m.index)));
   const el=document.createElement('span');el.className='math-source';el.dataset.tex=m[0];f.append(el);last=re.lastIndex;
  }
  if(hit){f.append(document.createTextNode(n.textContent.slice(last)));n.replaceWith(f)}
 }
 renderMathElements(root);
}
function insert(html){editor.focus();const t=document.createElement('template');t.innerHTML=safeHTML(html);renderLooseMath(t.content);const sel=getSelection();if(sel?.rangeCount&&editor.contains(sel.anchorNode)){const r=sel.getRangeAt(0);r.deleteContents();const last=t.content.lastChild;r.insertNode(t.content);if(last){r.setStartAfter(last);r.collapse(true);sel.removeAllRanges();sel.addRange(r)}}else editor.append(t.content);changed();scheduleMathRender()}
function richOrMarkdown(html,text){
 const t=document.createElement('template');t.innerHTML=html;
 const rich=!!t.content.querySelector('table,svg,img,math,.katex,pre,h1,h2,h3,h4,h5,h6,blockquote,ul,ol');
 const plain=escapedNewlines(text||t.content.textContent||'');
 const markdown=/(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|\|[^\n]+\||\$\$|<svg\b|!\[|```|>\s)/m.test(plain)||/\*\*[^*]+\*\*/.test(plain);
 // Rich ChatGPT HTML is retained, but a clipboard wrapper with raw Markdown must be parsed.
 return !rich&&markdown?parseDocument(plain):normalizePastedMath(html);
}
const dataURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
async function images(files){for(const f of files){if(!f||!f.type.startsWith('image/'))continue;const src=await dataURL(f);insert(`<img alt="貼上圖片" src="${src}">`)}}
editor.addEventListener('paste',async e=>{const d=e.clipboardData;if(!d)return;e.preventDefault();const fs=[...d.items].filter(x=>x.kind==='file'&&x.type.startsWith('image/')).map(x=>x.getAsFile());if(fs.length){await images(fs);return}const html=d.getData('text/html'),plain=escapedNewlines(d.getData('text/plain'));insert(/!\[[^\]]*\]\(data\\?:image\/svg\+xml/i.test(plain)?parseDocument(plain):(html?richOrMarkdown(html,plain):parseDocument(plain)))});
editor.addEventListener('dragover',e=>e.preventDefault());editor.addEventListener('drop',async e=>{if(e.dataTransfer.files.length){e.preventDefault();await images([...e.dataTransfer.files])}});editor.addEventListener('input',()=>{changed();scheduleMathRender()});
async function openFile(f){const t=await f.text();let html;if(/\.ainote$|\.json$/i.test(f.name)){try{const d=JSON.parse(t);if(d.format!=='AInote')throw Error('不支援格式');html=d.html}catch(e){alert('檔案錯誤：'+e.message);return}}else if(/\.html?$/i.test(f.name))html=new DOMParser().parseFromString(t,'text/html').body.innerHTML;else html=parseDocument(escapedNewlines(t));editor.innerHTML=safeHTML(html);renderLooseMath(editor);scheduleMathRender();setName(f.name);dirty=false;status('已開啟')}
input.onchange=async()=>{if(input.files[0]){handle=null;await openFile(input.files[0])}input.value=''};
document.querySelector('#open')?.addEventListener('click',async()=>{if(dirty&&!confirm('捨棄未儲存的內容？'))return;if(window.showOpenFilePicker){try{const [h]=await showOpenFilePicker();handle=h;await openFile(await h.getFile());return}catch(e){if(e.name==='AbortError')return}}input.click()});
// Downloads: folder access is supported only where the browser exposes File System Access API.
let downloadFolder=null;
const DOWNLOAD_FOLDER_KEY='ainote-download-folder-label';
function browserDownload(blob,n){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=n;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000)}
async function saveDownloadBlob(blob,n){
 if(downloadFolder){try{
  const permission=await downloadFolder.queryPermission({mode:'readwrite'});
  if(permission==='granted'){
   const file=await downloadFolder.getFileHandle(n,{create:true});const writable=await file.createWritable();await writable.write(blob);await writable.close();status('已保存到指定資料夾：'+n);return true;
  }
  status('資料夾授權已失效，改用瀏覽器下載');
 }catch(e){console.warn('Folder write failed',e);status('資料夾保存失敗，改用瀏覽器下載')}}
 browserDownload(blob,n);return false;
}
window.saveDownloadBlob=saveDownloadBlob;
function download(data,n,mime){return saveDownloadBlob(new Blob([data],{type:mime}),n)}
async function selectDownloadFolder(){
 if(typeof window.showDirectoryPicker!=='function'){
  alert('此瀏覽器不支援網站直接選擇下載資料夾。請使用瀏覽器的下載設定選擇路徑；網站仍可正常下載 ZIP、MD 和文件。');return;
 }
 try{
  const folder=await window.showDirectoryPicker({id:'ainote-download',mode:'readwrite'});
  downloadFolder=folder;
  localStorage.setItem(DOWNLOAD_FOLDER_KEY,folder.name);
  updateFolderLabel();status('下載資料夾：'+folder.name);
 }catch(e){if(e.name!=='AbortError')alert('無法開啟資料夾：'+e.message)}
}
function updateFolderLabel(){const el=document.querySelector('#download-folder');if(el)el.textContent='下載資料夾：'+(downloadFolder?.name||'瀏覽器預設')}
document.querySelector('#download-folder')?.addEventListener('click',selectDownloadFolder);
document.querySelector('#download-folder-reset')?.addEventListener('click',()=>{downloadFolder=null;localStorage.removeItem(DOWNLOAD_FOLDER_KEY);updateFolderLabel();status('已改回瀏覽器預設下載路徑')});
updateFolderLabel();
async function save(as=false){const content=JSON.stringify({format:'AInote',version:2,html:safeHTML(editor.innerHTML),updated:new Date().toISOString()},null,2);try{if(window.showSaveFilePicker){if(!handle||as)handle=await showSaveFilePicker({suggestedName:name.endsWith('.ainote')?name:'AInote.ainote',types:[{description:'AInote',accept:{'application/json':['.ainote']}}]});const w=await handle.createWritable();await w.write(content);await w.close();setName(handle.name);status('已儲存');dirty=false;return}download(content,name.endsWith('.ainote')?name:'AInote.ainote','application/json');dirty=false;status('已下載檔案')}catch(e){if(e.name!=='AbortError')alert('儲存失敗：'+e.message)}}
document.querySelector('#save')?.addEventListener('click',()=>save());document.querySelector('#saveas')?.addEventListener('click',()=>save(true));
document.querySelector('#md').onclick=()=>{const clone=editor.cloneNode(true);clone.querySelectorAll('.math-rendered').forEach(el=>el.replaceWith(document.createTextNode(el.dataset.latex||'')));const md=window.TurndownService?new TurndownService({headingStyle:'atx'}).turndown(clone.innerHTML):clone.innerHTML;download(md,name.replace(/\.[^.]+$/,'')+'.md','text/markdown');status(window.TurndownService?'已匯出 Markdown':'已匯出含 HTML 的 Markdown（未載入轉換套件）')};
document.querySelector('#clear').onclick=()=>{if(typeof window.createExplorerFile==='function')window.createExplorerFile();else status('Explorer 尚未載入')};
document.querySelector('#preview').onclick=()=>{refreshMathNow();status('已檢查未渲染公式（不修改既有公式）')};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});


// MathAutoRefresh: schedule one render after clipboard insertion and subsequent edits.
// The observer does not mutate the document unless unrendered delimiters are found.
let mathRefreshTimer=0,mathRefreshBusy=false;
function hasPendingMath(){
 if(editor.querySelector('.math-source'))return true;
 const w=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
 while(w.nextNode()){
  const n=w.currentNode;
  if(n.parentElement?.closest('pre,code,svg,math,.katex,.math-rendered,.math-source'))continue;
  if(/\$[^$\n]+\$|\\\(|\\\[/.test(n.textContent))return true;
 }
 return false;
}
function renderSplitDisplayMath(){
 // Browser contenteditable may put $$ and its expression into separate block nodes.
 const blocks=[...editor.children];
 for(let i=0;i<blocks.length;i++){
  const first=blocks[i];
  if(!/^(?:P|DIV)$/.test(first.tagName)||first.textContent.trim()!=='$$')continue;
  let j=i+1;
  while(j<blocks.length && blocks[j].textContent.trim()!=='$$' && j-i<40)j++;
  if(j>=blocks.length||blocks[j].textContent.trim()!=='$$'||j===i+1)continue;
  const raw='$$\n'+blocks.slice(i+1,j).map(x=>x.textContent).join('\n')+'\n$$';
  const holder=document.createElement('div');holder.className='math-source';holder.dataset.tex=raw;
  first.before(holder);for(let k=i;k<=j;k++)blocks[k].remove();
  renderMathElements(editor);return true;
 }
 return false;
}
function refreshMathNow(){
 if(mathRefreshBusy||!editor.isConnected)return;
 mathRefreshBusy=true;
 try{
  // Do not re-render existing .math-rendered nodes, which would duplicate text.
  if(hasPendingMath())renderLooseMath(editor);
  renderSplitDisplayMath();
  if(typeof upgradeFallbackMath==='function')upgradeFallbackMath();
 }finally{mathRefreshBusy=false}
}
function scheduleMathRender(){
 clearTimeout(mathRefreshTimer);
 mathRefreshTimer=setTimeout(refreshMathNow,90);
}
const mathObserver=new MutationObserver(()=>{
 if(!mathRefreshBusy && hasPendingMath())scheduleMathRender();
});
mathObserver.observe(editor,{childList:true,subtree:true,characterData:true});
editor.addEventListener('compositionend',scheduleMathRender);
// Allow CDN scripts to finish loading before retrying the offline fallback output.
window.addEventListener('load',scheduleMathRender);

// v2.3: rehydrate MathML fallback when KaTeX becomes available on mobile.
function upgradeFallbackMath(){
 if(!window.katex)return;
 editor.querySelectorAll('.math-rendered[data-math-fallback="1"]').forEach(el=>{
  const raw=el.dataset.latex||'',tex=raw.replace(/^\$\$|\$\$$/g,'').replace(/^\\\[|\\\]$/g,'').replace(/^\$|\$$/g,'').replace(/^\\\(|\\\)$/g,'').trim();
  try{katex.render(tex,el,{displayMode:el.dataset.mathMode==='display',throwOnError:false,trust:false,output:"html"});delete el.dataset.mathFallback}catch{}
 });
}
const originalRefreshMathNow=refreshMathNow;
// A small bounded retry also covers slow mobile CDN loading.
window.addEventListener('load',()=>{upgradeFallbackMath();scheduleMathRender()});
[300,1200,3000].forEach(delay=>setTimeout(()=>{upgradeFallbackMath();scheduleMathRender()},delay));
editor.addEventListener('paste',()=>setTimeout(upgradeFallbackMath,180));

// v2.4: If KaTeX CSS is delayed on mobile, the local rules hide duplicate MathML.
// Recheck once after a tab resumes, without parsing already rendered nodes twice.
document.addEventListener('visibilitychange',()=>{if(!document.hidden){upgradeFallbackMath();scheduleMathRender()}});
