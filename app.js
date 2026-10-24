// AREA A06 START: EditorController | File: app.js
'use strict';
const editor=document.querySelector('#editor'),statusEl=document.querySelector('#status'),filenameEl=document.querySelector('#filename'),input=document.querySelector('#file');
let handle=null,name='未命名.md',dirty=false;
let rawMarkdown='';let renderingDocument=false;
function markdownFromEditor(){const clone=editor.cloneNode(true);clone.querySelectorAll('.math-rendered').forEach(el=>el.replaceWith(document.createTextNode(el.dataset.latex||el.dataset.tex||'')));clone.querySelectorAll('.math-source').forEach(el=>el.replaceWith(document.createTextNode(el.dataset.tex||'')));return window.TurndownService?new TurndownService({headingStyle:'atx',codeBlockStyle:'fenced'}).turndown(clone.innerHTML):clone.innerHTML;}
function renderRaw(){renderingDocument=true;editor.innerHTML=safeHTML(parseDocument(rawMarkdown));renderLooseMath(editor);scheduleMathRender();window.BVRenderMermaid?.();renderingDocument=false;}
function updateRawFromVisual(){if(!renderingDocument){rawMarkdown=markdownFromEditor();changed();}}

editor.spellcheck=false;
editor.setAttribute('data-gramm','false');
editor.setAttribute('data-gramm_editor','false');
function status(s){statusEl.textContent=s}function setName(s){name=s;filenameEl.textContent=s}function changed(){dirty=true;status('尚未儲存');window.BVRefreshUnsaved?.()}
const escapedNewlines=t=>!t.includes('\n')&&(t.match(/\\n/g)||[]).length>=2?t.replace(/\\r\\n|\\n|\\r/g,'\n'):t.replace(/\r\n?/g,'\n');
function safeHTML(html){
 const t=document.createElement('template');t.innerHTML=html;
 t.content.querySelectorAll('script,iframe,object,embed,style,link,meta,form').forEach(x=>x.remove());
 t.content.querySelectorAll('*').forEach(el=>{const svg=!!el.closest('svg');for(const a of [...el.attributes]){
  const n=a.name.toLowerCase(),v=a.value.trim();if(n.startsWith('on')||n==='style'||n==='color'||n==='bgcolor'||n==='class'&& !['math-source','math-rendered','mermaid'].includes(v)||['href','src','xlink:href'].includes(n)&&!(/^(https?:\/\/|data:image\/(png|jpeg|gif|webp|svg\+xml);base64,|#)/i.test(v)))el.removeAttribute(a.name);
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
function insert(html){editor.focus();const t=document.createElement('template');t.innerHTML=safeHTML(normalizeCopiedMath(html));renderLooseMath(t.content);const sel=getSelection();if(sel?.rangeCount&&editor.contains(sel.anchorNode)){const r=sel.getRangeAt(0);r.deleteContents();const last=t.content.lastChild;r.insertNode(t.content);if(last){r.setStartAfter(last);r.collapse(true);sel.removeAllRanges();sel.addRange(r)}}else editor.append(t.content);updateRawFromVisual();scheduleMathRender()}
// Convert copied KaTeX output into ONE canonical LaTeX node before sanitizing.
// KaTeX HTML includes both accessible MathML and visual HTML: retaining both
// without its CSS causes duplicated formulas and stray plain text.
function normalizeCopiedMath(html){
 const t=document.createElement('template');t.innerHTML=html;
 for(const el of [...t.content.querySelectorAll('.katex-display, .katex')]){
  if(!el.isConnected)continue;
  if(el.classList.contains('katex')&&el.closest('.katex-display'))continue;
  const annotation=el.querySelector('annotation[encoding="application/x-tex"]');
  if(!annotation)continue;
  const tex=annotation.textContent||'';
  const display=el.classList.contains('katex-display');
  const holder=document.createElement(display?'div':'span');
  holder.className='math-source';
  holder.dataset.tex=display?'$$'+tex+'$$':'\\('+tex+'\\)';
  holder.textContent=holder.dataset.tex;
  // Some clipboard providers append a second plain-text equation after KaTeX.
  // Remove only an immediately adjacent exact duplicate, never unrelated prose.
  const key=x=>String(x).replace(/\s+/g,'').replace(/\\(?:left|right)/g,'');
  let next=el.nextSibling;
  while(next && next.nodeType===3 && !next.textContent.trim())next=next.nextSibling;
  if(next && next.nodeType===1 && /^(?:SPAN|P|DIV)$/.test(next.nodeName) && !next.querySelector('img,svg,math,.katex')){
   const candidate=next.textContent.trim();
   if(candidate && (key(candidate)===key(tex) || key(candidate)===key('$$'+tex+'$$') || key(candidate)===key('\\('+tex+'\\)')))next.remove();
  }
  el.replaceWith(holder);
 }
 return t.innerHTML;
}
function richOrMarkdown(html,text){
 const t=document.createElement('template');t.innerHTML=html;
 const rich=!!t.content.querySelector('table,svg,img,math,.katex,pre,h1,h2,h3,h4,h5,h6,blockquote,ul,ol');
 const plain=escapedNewlines(text||t.content.textContent||'');
 const markdown=/(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|\|[^\n]+\||\$\$|<svg\b|!\[|```|>\s)/m.test(plain)||/\*\*[^*]+\*\*/.test(plain);
 // Rich ChatGPT HTML is retained, but a clipboard wrapper with raw Markdown must be parsed.
 return !rich&&markdown?parseDocument(plain):normalizeCopiedMath(html);
}
const dataURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
async function images(files){for(const f of files){if(!f||!f.type.startsWith('image/'))continue;const src=await dataURL(f);insert(`<img alt="貼上圖片" src="${src}">`)}}
editor.addEventListener('paste',async e=>{const d=e.clipboardData;if(!d)return;e.preventDefault();const fs=[...d.items].filter(x=>x.kind==='file'&&x.type.startsWith('image/')).map(x=>x.getAsFile());if(fs.length){await images(fs);return}const html=d.getData('text/html'),plain=escapedNewlines(d.getData('text/plain'));insert(html?richOrMarkdown(html,plain):parseDocument(plain));rawMarkdown=markdownFromEditor()});
editor.addEventListener('dragover',e=>e.preventDefault());editor.addEventListener('drop',async e=>{if(e.dataTransfer.files.length){e.preventDefault();await images([...e.dataTransfer.files])}});editor.addEventListener('input',()=>{updateRawFromVisual();scheduleMathRender()});
async function openFile(f){const t=await f.text();let md=t;if(/\.ainote$|\.json$/i.test(f.name)){try{const d=JSON.parse(t);if(d.format!=='AInote')throw Error('不支援格式');md=typeof d.markdown==='string'?d.markdown:htmlToMarkdown(d.html||'');}catch(e){alert('檔案錯誤：'+e.message);return}}else if(/\.html?$/i.test(f.name))md=htmlToMarkdown(new DOMParser().parseFromString(t,'text/html').body.innerHTML);rawMarkdown=md;renderRaw();setName(f.name.replace(/\.(ainote|json|html?)$/i,'.md'));dirty=false;window.BVSetDocumentVisible?.(true);window.BVRefreshUnsaved?.();status('已從 Markdown 原始碼開啟')}
function htmlToMarkdown(html){return window.TurndownService?new TurndownService({headingStyle:'atx',codeBlockStyle:'fenced'}).turndown(normalizeCopiedMath(html)):html;}
input.onchange=async()=>{if(input.files[0]){handle=null;await openFile(input.files[0])}input.value=''};
document.querySelector('#open').onclick=async()=>{if(dirty&&!confirm('捨棄未儲存的內容？'))return;if(window.showOpenFilePicker){try{const [h]=await showOpenFilePicker({types:[{description:'Markdown',accept:{'text/markdown':['.md','.markdown','.txt']}}],excludeAcceptAllOption:false});handle=h;await openFile(await h.getFile());return}catch(e){if(e.name==='AbortError')return}}input.click()};
function download(data,n,mime){const u=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement('a');a.href=u;a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
async function save(as=false){
 // The selected Explorer file is authoritative only when it matches the active editor.
 // A standalone "新文件" always uses its own Save File Picker.
 const content=sourceArea?.style.display!=='none'?sourceArea.value:rawMarkdown;
 try{
  if(!as&&typeof window.BVSaveSelectedFile==='function'){
   const result=await window.BVSaveSelectedFile(content);
   if(result!==null){if(result){rawMarkdown=content;dirty=false;window.BVRefreshUnsaved?.();}return result;}
  }
  if(window.showSaveFilePicker){
   let target=handle;
   if(!target||as||!/\.(md|markdown|txt)$/i.test(target.name))target=await showSaveFilePicker({suggestedName:name.replace(/\.[^.]+$/,'')+'.md',types:[{description:'Markdown 原始碼',accept:{'text/markdown':['.md']}}]});
   const w=await target.createWritable();await w.write(content);await w.close();
   handle=target;setName(target.name);status('已儲存原始 Markdown');dirty=false;rawMarkdown=content;window.BVRefreshUnsaved?.();return true;
  }
  download(content,name.replace(/\.[^.]+$/,'')+'.md','text/markdown;charset=utf-8');
  status('已下載原始 Markdown（瀏覽器不支援直接寫入）');dirty=false;rawMarkdown=content;window.BVRefreshUnsaved?.();return true;
 }catch(e){if(e.name!=='AbortError')alert('儲存失敗：'+e.message);return false;}
}
document.querySelector('#save').onclick=()=>save();document.querySelector('#saveas').onclick=()=>save(true);
document.querySelector('#md').onclick=()=>{download(rawMarkdown,name.replace(/\.[^.]+$/,'')+'.md','text/markdown;charset=utf-8');status('已匯出原始 Markdown')};
document.querySelector('#clear').onclick=()=>window.BVCreateNewDocument?.();
const sourceButton=document.createElement('button');sourceButton.textContent='MD 原始碼';sourceButton.id='source-toggle';document.querySelector('#editor-header-tools').prepend(sourceButton);
const sourceArea=document.createElement('textarea');sourceArea.id='source-editor';sourceArea.spellcheck=false;sourceArea.style.cssText='display:none;width:100%;height:75vh;box-sizing:border-box;background:#1e222a;color:white;border:1px solid #566071;padding:20px;font:15px/1.65 monospace;resize:vertical';editor.insertAdjacentElement('afterend',sourceArea);
sourceButton.onclick=()=>{const active=sourceArea.style.display!=='none';if(active){rawMarkdown=sourceArea.value;renderRaw();sourceArea.style.display='none';editor.style.display='';sourceButton.textContent='MD 原始碼';}else{sourceArea.value=rawMarkdown;sourceArea.style.display='block';editor.style.display='none';sourceButton.textContent='返回預覽';}};
sourceArea.addEventListener('input',()=>{rawMarkdown=sourceArea.value;changed()});
// Paste clipboard images as Markdown at the textarea caret (also supports Ctrl+V).
sourceArea.addEventListener('paste',async e=>{
 const images=[...(e.clipboardData?.items||[])].filter(item=>item.kind==='file'&&item.type.startsWith('image/')).map(item=>item.getAsFile()).filter(Boolean);
 if(!images.length)return;
 e.preventDefault();
 const start=sourceArea.selectionStart,end=sourceArea.selectionEnd;
 const snippets=[];
 for(const file of images){const data=await dataURL(file);snippets.push(`![貼上圖片](${data})`)}
 const text=snippets.join('\n');
 sourceArea.setRangeText(text,start,end,'end');
 sourceArea.dispatchEvent(new Event('input',{bubbles:true}));
 status('已貼上圖片，請 Commit 儲存文件');
});

document.querySelector('#preview').onclick=()=>{refreshMathNow();status('已檢查並渲染未處理的公式')};
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

// v2.2.1: Portal settings popup outside the scroll-clipped header.
(()=>{
 const b=document.querySelector('#settings-toggle'),m=document.querySelector('#settings-menu');
 if(!b||!m)return;
 document.body.appendChild(m);
 function position(){
  const r=b.getBoundingClientRect();
  const w=m.offsetWidth||190,h=m.offsetHeight||130,pad=8;
  const left=Math.max(pad,Math.min(window.innerWidth-w-pad,r.right-w));
  const below=r.bottom+6;
  const top=below+h+pad<=window.innerHeight?below:Math.max(pad,r.top-h-6);
  m.style.left=left+'px';m.style.top=top+'px';
 }
 function close(){m.hidden=true;b.setAttribute('aria-expanded','false')}
 b.addEventListener('click',e=>{e.stopPropagation();if(!m.hidden){close();return;}m.hidden=false;b.setAttribute('aria-expanded','true');position()});
 document.addEventListener('pointerdown',e=>{if(!m.hidden&&!m.contains(e.target)&&!b.contains(e.target))close()});
 m.addEventListener('click',e=>{if(e.target.closest('button'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 const explorerToggle=document.querySelector('#settings-explorer');
 if(explorerToggle)explorerToggle.addEventListener('click',()=>{window.BVToggleExplorer?.()});
 window.addEventListener('resize',()=>{if(!m.hidden)position()});
 window.addEventListener('scroll',()=>{if(!m.hidden)position()},true);
})();

window.BVGetRawMarkdown=()=>sourceArea.style.display!=='none'?sourceArea.value:rawMarkdown;

window.BVSetRawMarkdown=(text)=>{rawMarkdown=text;renderRaw();dirty=true;window.BVRefreshUnsaved?.();window.BVRefreshFileRecords?.();};
// AREA A06 END: EditorController
