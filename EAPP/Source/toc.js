'use strict';
(()=>{
const editor=document.querySelector('#editor'),source=document.querySelector('#source-editor'),main=document.querySelector('.workspace main');
const menu=document.createElement('div');menu.id='text-actions';menu.hidden=true;document.body.append(menu);
const panel=document.createElement('section');panel.id='toc-panel';panel.hidden=true;document.body.append(panel);
const tocButton=document.querySelector('#toc-toggle');
const popup=document.createElement('div');popup.id='bv-inline-popup';popup.hidden=true;document.body.append(popup);
let batchMode=false,chosen=new Set();
function showPopup(anchor,title,value,actions){popup.replaceChildren();const h=document.createElement('div');h.className='bv-popup-title';h.textContent=title;popup.append(h);const field=document.createElement('textarea');field.rows=2;field.value=value||'';popup.append(field);const buttons=document.createElement('div');buttons.className='bv-popup-buttons';for(const [label,callback,danger] of actions){const b=document.createElement('button');b.textContent=label;if(danger)b.className='bv-danger';b.onclick=()=>{callback(field.value);popup.hidden=true};buttons.append(b)}const cancel=document.createElement('button');cancel.textContent='取消';cancel.onclick=()=>popup.hidden=true;buttons.append(cancel);popup.append(buttons);popup.hidden=false;const rect=anchor?.getBoundingClientRect?.()||{left:innerWidth/2,top:innerHeight/2,bottom:innerHeight/2};const w=Math.min(310,innerWidth-16);popup.style.width=w+'px';popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-w-8))+'px';popup.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-185))+'px';field.focus();field.select();}
function selectionAnchor(){const sel=window.getSelection();if(sel?.rangeCount&&!sel.isCollapsed){const rect=sel.getRangeAt(0).getBoundingClientRect();if(rect.width||rect.height)return {getBoundingClientRect:()=>rect}}return source.style.display!=='none'?source:editor;}

let activeKey='',records={toc:[],notes:[]},lastSelection=null;
const storeKey=()=>activeKey?'bv-note-annotations:'+activeKey:null;
async function saveRecords(){
 if(!storeKey())return;
 localStorage.setItem(storeKey(),JSON.stringify(records));
 try{
  await window.BVPutFileRecords?.(activeKey,structuredClone(records));
  // Each completed metadata operation also commits the active document.
  const raw=window.BVGetRawMarkdown?.();
  if(typeof raw==='string'&&typeof window.BVSaveSelectedFile==='function'){
   const ok=await window.BVSaveSelectedFile(raw);
   if(ok===false)throw Error('文件儲存失敗');
  }
 }catch(e){console.error('自動儲存失敗',e);document.querySelector('#status').textContent='自動儲存失敗：'+e.message;}
}
function readRecords(){try{records=window.BVGetFileRecords?.(activeKey)||JSON.parse(localStorage.getItem(storeKey())||'{"toc":[],"notes":[]}')}catch{records={toc:[],notes:[]}}records.toc||=[];records.notes=[];reconcile();renderPanel();decorate();}
function reconcile(){const raw=window.BVGetRawMarkdown?.()||'';let changed=false;for(const kind of ['toc']){const old=records[kind].length;records[kind]=records[kind].filter(r=>r.text&&raw.includes(r.text));changed ||=old!==records[kind].length;}if(changed)saveRecords();}
function getSelected(){const isEdit=source.style.display!=='none';if(isEdit){const text=source.value.slice(source.selectionStart,source.selectionEnd);return text.trim()?{text,offset:source.selectionStart}:null;}const sel=window.getSelection();if(!sel||sel.isCollapsed||!editor.contains(sel.anchorNode))return null;const text=sel.toString();if(!text.trim())return null;const raw=window.BVGetRawMarkdown?.()||'';return {text,offset:raw.indexOf(text)};}
function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{menu.hidden=true;fn()};menu.append(b)}
function showMenu(x,y,selected=null){lastSelection=selected||getSelected();if(!lastSelection)return false;menu.replaceChildren();button('目錄化',()=>{const text=lastSelection.text;records.toc.push({id:crypto.randomUUID(),text,offset:lastSelection.offset,name:text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate();});menu.hidden=false;menu.style.left=Math.max(8,Math.min(x,innerWidth-190))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-110))+'px';return true;}
function locate(r){const raw=window.BVGetRawMarkdown?.()||'';const at=raw.indexOf(r.text,Math.max(0,r.offset||0));const pos=at>=0?at:raw.indexOf(r.text);if(pos<0)return;if(source.style.display!=='none'){source.focus();source.setSelectionRange(pos,pos+r.text.length);const lines=raw.slice(0,pos).split('\n').length;source.scrollTop=Math.max(0,(lines-4)*parseFloat(getComputedStyle(source).lineHeight||24));}else{const w=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let n;const needle=r.text.trim().slice(0,100);while(n=w.nextNode()){if(n.textContent.includes(needle)){n.parentElement.scrollIntoView({block:'center',behavior:'smooth'});return;}}main.scrollTop=0;}}
function renderPanel(){panel.replaceChildren();const heading=document.createElement('div');heading.className='toc-heading';heading.textContent='目錄';const batch=document.createElement('button');batch.textContent=batchMode?'完成選取':'批量選取';batch.onclick=()=>{batchMode=!batchMode;if(!batchMode)chosen.clear();renderPanel()};heading.append(batch);const make=document.createElement('button');make.textContent='目錄化';make.onclick=()=>{const selected=getSelected()||cachedSelection;if(!selected)return alert('請先在文件中框選文字');records.toc.push({id:crypto.randomUUID(),text:selected.text,offset:selected.offset,name:selected.text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate()};heading.append(make);const close=document.createElement('button');close.textContent='×';close.onclick=()=>panel.hidden=true;heading.append(close);panel.append(heading);
if(batchMode){const tools=document.createElement('div');tools.className='toc-batch-tools';const all=document.createElement('button');all.textContent='全選';all.onclick=()=>{records.toc.forEach(r=>chosen.add(r.id));renderPanel()};tools.append(all);const del=document.createElement('button');del.textContent=`刪除所選 (${chosen.size})`;del.className='bv-danger';del.disabled=!chosen.size;del.onclick=()=>{showPopup(del,'批量刪除目錄',`確定刪除 ${chosen.size} 個目錄？`,[['確認刪除',()=>{records.toc=records.toc.filter(r=>!chosen.has(r.id));chosen.clear();saveRecords();renderPanel();decorate()},true]])};tools.append(del);panel.append(tools)}
for(const r of records.toc){const row=document.createElement('div');row.className='toc-entry';if(batchMode){const check=document.createElement('input');check.type='checkbox';check.checked=chosen.has(r.id);check.onchange=()=>{check.checked?chosen.add(r.id):chosen.delete(r.id);renderPanel()};row.append(check)}const name=document.createElement('span');name.textContent=r.name;row.append(name);row.onclick=e=>{if(batchMode){if(e.target.tagName!=='INPUT'){chosen.has(r.id)?chosen.delete(r.id):chosen.add(r.id);renderPanel()}return}locate(r);panel.hidden=true};const actions=()=>{showPopup(row,'目錄名稱',r.name,[['儲存',value=>{if(value.trim())r.name=value.trim();saveRecords();renderPanel();decorate()}],['刪除',()=>{records.toc=records.toc.filter(x=>x!==r);chosen.delete(r.id);saveRecords();renderPanel();decorate()},true]])};row.oncontextmenu=e=>{e.preventDefault();actions()};let timer;row.addEventListener('touchstart',()=>{timer=setTimeout(actions,550)},{passive:true});row.addEventListener('touchend',()=>clearTimeout(timer));row.addEventListener('touchmove',()=>clearTimeout(timer));panel.append(row)}if(!records.toc.length){const empty=document.createElement('p');empty.textContent='目前沒有目錄。選取文字後使用「目錄化」。';panel.append(empty)}}
function decorate(){if(source.style.display!=='none')return;editor.querySelectorAll('span.bv-toc-underline').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));editor.normalize();for(const r of records.toc){const needle=r.text.trim();if(!needle||needle.includes('\n'))continue;const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){if(n.parentElement?.closest('pre,code,svg,.katex,mark,.bv-toc-underline'))continue;const idx=n.textContent.indexOf(needle);if(idx<0)continue;const range=document.createRange();range.setStart(n,idx);range.setEnd(n,idx+needle.length);const span=document.createElement('span');span.className='bv-toc-underline';range.surroundContents(span);break;}}}
window.BVFlushFileRecords=()=>{if(!activeKey)return Promise.resolve();return window.BVPutFileRecords?.(activeKey,structuredClone(records))||Promise.resolve()};
window.BVActivateFileRecords=(key)=>{activeKey=key;panel.hidden=true;popup.hidden=true;batchMode=false;chosen.clear();readRecords()};
window.BVRefreshFileRecords=()=>{if(!activeKey)return;reconcile();renderPanel();if(source.style.display==='none')requestAnimationFrame(decorate)};
tocButton.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)renderPanel()};
// Text actions are accessible exclusively from Settings → 文本工具.
// Capture the selection before focus shifts to the toolbar (important for mobile).
let cachedSelection=null;
function rememberSelection(){const selection=getSelected();if(selection)cachedSelection={...selection};}
for(const el of [editor,source]){
 el.addEventListener('mouseup',rememberSelection);
 el.addEventListener('keyup',rememberSelection);
 el.addEventListener('touchend',()=>setTimeout(rememberSelection,0),{passive:true});
}
const settingsButton=document.querySelector('#settings-toggle');
settingsButton?.addEventListener('pointerdown',rememberSelection,{capture:true});
const imagePicker=document.querySelector('#insert-image-file');
let imageInsertionPosition=null;
function imageMarkdown(file,data){const safe=file.name.replace(/[\[\]\n\r]/g,' ');return `![${safe}](${data})`;}
async function insertSelectedImage(file){
 if(!file||!file.type.startsWith('image/'))return;
 if(file.size>8*1024*1024&&!confirm('圖片超過 8MB，嵌入 Markdown 後文件會變大。繼續？'))return;
 try{
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)});
  const raw=window.BVGetRawMarkdown?.()||'';
  const pos=Math.min(raw.length,Math.max(0,imageInsertionPosition??raw.length));
  const md=imageMarkdown(file,data);
  const prefix=pos&&raw[pos-1]!=='\n'?'\n':'';const next=raw.slice(0,pos)+prefix+md+'\n'+raw.slice(pos);
  source.value=next;
  source.dispatchEvent(new Event('input',{bubbles:true}));
  if(source.style.display==='none'){
   window.BVSetRawMarkdown?.(next);
  }else{source.focus();source.setSelectionRange(pos+prefix.length+md.length+1,pos+prefix.length+md.length+1);}
  if(source.style.display==='none'){const ok=await window.BVSaveSelectedFile?.(next);document.querySelector('#status').textContent=ok?'圖片已插入並自動保存':'圖片已插入但保存失敗';}else document.querySelector('#status').textContent='圖片已插入，請 Commit 儲存文件';
 }catch(e){alert('插入圖片失敗：'+e.message)}
}
imagePicker?.addEventListener('change',async()=>{const file=imagePicker.files?.[0];imagePicker.value='';await insertSelectedImage(file)});
const textTools=document.querySelector('#settings-text-tools');
textTools?.addEventListener('click',()=>{
 const selected=getSelected()||cachedSelection;
 menu.replaceChildren();
 if(selected){
  lastSelection={...selected};
  button('目錄化',()=>{const text=lastSelection.text;records.toc.push({id:crypto.randomUUID(),text,offset:lastSelection.offset,name:text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate()});
 }
 button('插入文本',()=>{
  const current=lastSelection||selected;
  if(!current?.text)return alert('請先框選要定位的文字');
  const raw=window.BVGetRawMarkdown?.()||'';
  const start=current.offset>=0&&raw.slice(current.offset,current.offset+current.text.length)===current.text?current.offset:raw.indexOf(current.text);
  if(start<0)return alert('找不到框選的原始文字，請重新選取');
  const end=start+current.text.length;
  showPopup(selectionAnchor(),'插入文本（選取段落最後一字之後）','',[["插入",value=>{
   const updated=raw.slice(0,end)+value+raw.slice(end);
   if(source.style.display!=='none'){
    source.value=updated;source.dispatchEvent(new Event('input',{bubbles:true}));source.focus();source.setSelectionRange(end+value.length,end+value.length);
   }else{
    window.BVSetRawMarkdown?.(updated);
   }
   document.querySelector('#status').textContent='文本已插入，請 Commit 儲存';
  }]]);
 });
 button('插入圖片',()=>{
  if(source.style.display!=='none')imageInsertionPosition=source.selectionStart;
  else{
   const raw=window.BVGetRawMarkdown?.()||'';
   if(selected?.offset>=0){const end=selected.offset+selected.text.length;const nextLine=raw.indexOf('\n',end);imageInsertionPosition=nextLine<0?raw.length:nextLine+1;}
   else imageInsertionPosition=raw.length;
  }
  imagePicker?.click();
 });
 const r=textTools.getBoundingClientRect();menu.hidden=false;menu.style.left=Math.max(8,Math.min(r.left,innerWidth-190))+'px';menu.style.top=Math.max(8,Math.min(r.bottom+8,innerHeight-150))+'px';
});
document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.hidden=true;if(!panel.contains(e.target)&&e.target!==tocButton&&!popup.contains(e.target))panel.hidden=true});
editor.addEventListener('input',()=>setTimeout(window.BVRefreshFileRecords,100));source.addEventListener('input',()=>setTimeout(window.BVRefreshFileRecords,100));
})();
