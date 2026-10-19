'use strict';
(()=>{
const editor=document.querySelector('#editor'),source=document.querySelector('#source-editor'),main=document.querySelector('.workspace main');
const menu=document.createElement('div');menu.id='text-actions';menu.hidden=true;document.body.append(menu);
const panel=document.createElement('section');panel.id='toc-panel';panel.hidden=true;document.body.append(panel);
const tocButton=document.querySelector('#toc-toggle');
const marksPanel=document.createElement('section');marksPanel.id='marks-panel';marksPanel.hidden=true;document.body.append(marksPanel);
const popup=document.createElement('div');popup.id='bv-inline-popup';popup.hidden=true;document.body.append(popup);
let batchMode=false,chosen=new Set();const expandedMarks=new Set();
function showPopup(anchor,title,value,actions){popup.replaceChildren();const h=document.createElement('div');h.className='bv-popup-title';h.textContent=title;popup.append(h);const field=document.createElement('textarea');field.rows=2;field.value=value||'';popup.append(field);const buttons=document.createElement('div');buttons.className='bv-popup-buttons';for(const [label,callback,danger] of actions){const b=document.createElement('button');b.textContent=label;if(danger)b.className='bv-danger';b.onclick=()=>{callback(field.value);popup.hidden=true};buttons.append(b)}const cancel=document.createElement('button');cancel.textContent='取消';cancel.onclick=()=>popup.hidden=true;buttons.append(cancel);popup.append(buttons);popup.hidden=false;const rect=anchor?.getBoundingClientRect?.()||{left:innerWidth/2,top:innerHeight/2,bottom:innerHeight/2};const w=Math.min(310,innerWidth-16);popup.style.width=w+'px';popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-w-8))+'px';popup.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-185))+'px';field.focus();field.select();}
function selectionAnchor(){const sel=window.getSelection();if(sel?.rangeCount&&!sel.isCollapsed){const rect=sel.getRangeAt(0).getBoundingClientRect();if(rect.width||rect.height)return {getBoundingClientRect:()=>rect}}return source.style.display!=='none'?source:editor;}

let activeKey='',records={toc:[],notes:[],marks:[]},lastSelection=null;
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
function readRecords(){try{records=window.BVGetFileRecords?.(activeKey)||JSON.parse(localStorage.getItem(storeKey())||'{"toc":[],"notes":[]}')}catch{records={toc:[],notes:[],marks:[]}}records.toc||=[];records.notes||=[];records.marks||=[];reconcile();renderPanel();renderMarks();decorate();}
function reconcile(){const raw=window.BVGetRawMarkdown?.()||'';let changed=false;for(const kind of ['toc']){const old=records[kind].length;records[kind]=records[kind].filter(r=>r.text&&raw.includes(r.text));changed ||=old!==records[kind].length;}if(changed)saveRecords();}
function addMark(selected){
 if(!selected?.text?.trim())return alert('請先選取文字');
 const raw=window.BVGetRawMarkdown?.()||'';
 const at=selected.offset>=0&&raw.slice(selected.offset,selected.offset+selected.text.length)===selected.text?selected.offset:raw.indexOf(selected.text);
 if(at<0)return alert('找不到選取文字在 Markdown 原文中的位置，請切換原始碼模式選取');
 records.marks.push({id:crypto.randomUUID(),text:selected.text,offset:at,name:selected.text.trim().split('\n')[0].slice(0,80),note:'',before:raw.slice(Math.max(0,at-30),at),after:raw.slice(at+selected.text.length,at+selected.text.length+30)});
 saveRecords();renderMarks();decorate();
}
// Floating annotation note: starts at the upper-right and can be dragged by its header.
const markFloat=document.createElement('section');markFloat.id='bv-mark-float';markFloat.hidden=true;document.body.append(markFloat);
let floatPinned=false,floatMarkId=null;
function hideMarkFloat(force=false){if(force||!floatPinned){markFloat.hidden=true;floatPinned=false;floatMarkId=null}}
function showMarkFloat(r,edit=false){
 if(!r||(!edit&&!String(r.note||'').trim()))return;
 markFloat.replaceChildren();floatPinned=edit;floatMarkId=r.id;
 const head=document.createElement('div');head.className='bv-mark-float-head';
 const title=document.createElement('strong');title.textContent=edit?'編輯標註備註':'標註備註';head.append(title);
 const close=document.createElement('button');close.type='button';close.textContent='×';close.onclick=()=>hideMarkFloat(true);head.append(close);markFloat.append(head);
 const label=document.createElement('div');label.className='bv-mark-float-label';label.textContent=r.name||r.text;markFloat.append(label);
 if(edit){const area=document.createElement('textarea');area.rows=5;area.value=r.note||'';area.placeholder='輸入備註';markFloat.append(area);
 const actions=document.createElement('div');actions.className='bv-mark-float-actions';
 const save=document.createElement('button');save.textContent='儲存備註';save.onclick=()=>{r.note=area.value;saveRecords();renderMarks();hideMarkFloat(true)};actions.append(save);
 const cancel=document.createElement('button');cancel.textContent='取消';cancel.onclick=()=>hideMarkFloat(true);actions.append(cancel);markFloat.append(actions);
 }else{const note=document.createElement('div');note.className='bv-mark-float-note';note.textContent=r.note;markFloat.append(note)}
 markFloat.hidden=false;
 if(!markFloat.dataset.moved){markFloat.style.top='70px';markFloat.style.right='14px';markFloat.style.left='auto'}
}
let dragFloat=null;
markFloat.addEventListener('pointerdown',e=>{if(!e.target.closest('.bv-mark-float-head')||e.target.closest('button'))return;
 const rect=markFloat.getBoundingClientRect();dragFloat={id:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};markFloat.setPointerCapture(e.pointerId);e.preventDefault()});
markFloat.addEventListener('pointermove',e=>{if(!dragFloat||dragFloat.id!==e.pointerId)return;
 const x=Math.max(0,Math.min(innerWidth-markFloat.offsetWidth,e.clientX-dragFloat.dx));
 const y=Math.max(0,Math.min(innerHeight-markFloat.offsetHeight,e.clientY-dragFloat.dy));
 markFloat.style.left=x+'px';markFloat.style.top=y+'px';markFloat.style.right='auto';markFloat.dataset.moved='1'});
for(const ev of ['pointerup','pointercancel'])markFloat.addEventListener(ev,()=>dragFloat=null);
editor.addEventListener('pointerover',e=>{if(floatPinned)return;const span=e.target.closest?.('.bv-mark-highlight[data-mark-id]');if(!span)return;const r=records.marks.find(x=>x.id===span.dataset.markId);if(r?.note?.trim()&&floatMarkId!==r.id)showMarkFloat(r,false)});
editor.addEventListener('pointerout',e=>{if(floatPinned)return;const span=e.target.closest?.('.bv-mark-highlight[data-mark-id]');if(span&&!span.contains(e.relatedTarget))hideMarkFloat()});
editor.addEventListener('dblclick',e=>{const span=e.target.closest?.('.bv-mark-highlight[data-mark-id]');if(!span)return;const r=records.marks.find(x=>x.id===span.dataset.markId);if(r){e.preventDefault();showMarkFloat(r,true)}});
function downloadMarkList(){
 const name=(document.querySelector('#current-file-name')?.textContent||activeKey||'BV-Note').replace(/[\\/:*?"<>|]/g,'_');
 const clean=v=>String(v||'').replace(/\r/g,'').trim();
 const lines=['# 標記列表','',`來源文件：${name}`,'',`標記數量：${records.marks.length}`,''];
 records.marks.forEach((r,i)=>{lines.push(`## ${i+1}. ${clean(r.name)||'未命名標註'}`,'',`> ${clean(r.text).replace(/\n/g,'\n> ')}`,'','**備註**','',clean(r.note)||'（無備註）','','---','')});
 const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='標記列表.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function renderMarks(){
 marksPanel.replaceChildren();const head=document.createElement('div');head.className='toc-heading';
 const title=document.createElement('strong');title.textContent=`標記列表 (${records.marks.length})`;head.append(title);
 const close=document.createElement('button');close.textContent='×';close.onclick=()=>marksPanel.hidden=true;head.append(close);const download=document.createElement('button');download.textContent='下載列表 (.md)';download.onclick=downloadMarkList;head.insertBefore(download,close);marksPanel.append(head);
 const add=document.createElement('button');add.textContent='＋ 標註目前選取';add.onclick=()=>addMark(getSelected()||cachedSelection);marksPanel.append(add);
 for(const r of records.marks){const row=document.createElement('div');row.className='bv-mark-entry';
 const summary=document.createElement('div');summary.className='bv-mark-summary';summary.title='點擊詞卡可展開或收合';
 const toggle=document.createElement('button');toggle.className='bv-mark-toggle';toggle.textContent=(expandedMarks.has(r.id)?'▾ ':'▸ ')+(r.name||r.text.slice(0,80));toggle.title='展開／收合標註';toggle.setAttribute('aria-expanded',String(expandedMarks.has(r.id)));toggle.onclick=()=>{expandedMarks.has(r.id)?expandedMarks.delete(r.id):expandedMarks.add(r.id);renderMarks()};summary.append(toggle);
 const locateButton=document.createElement('button');locateButton.textContent='快速定位';locateButton.className='bv-mark-locate';locateButton.onclick=()=>{if(!locate(r))alert('找不到標註位置，原文可能已被修改')};summary.append(locateButton);row.append(summary);summary.addEventListener('click',e=>{if(e.target.closest('.bv-mark-locate,.bv-mark-toggle'))return;toggle.click()});
 if(expandedMarks.has(r.id)){
 const quote=document.createElement('div');quote.className='bv-mark-quote';quote.textContent=r.text;row.append(quote);
 const label=document.createElement('label');label.textContent='備註';row.append(label);
 const note=document.createElement('textarea');note.rows=2;note.value=r.note||'';note.placeholder='輸入此標註的備註';note.setAttribute('aria-label','標註備註');row.append(note);
 const tools=document.createElement('div');tools.className='bv-mark-tools';
 const save=document.createElement('button');save.textContent='儲存備註';save.onclick=()=>{r.note=note.value;saveRecords()};tools.append(save);
 const rename=document.createElement('button');rename.textContent='重新命名';rename.onclick=()=>showPopup(rename,'標註名稱',r.name,[['儲存',v=>{if(v.trim())r.name=v.trim();saveRecords();renderMarks()}]]);tools.append(rename);
 const del=document.createElement('button');del.textContent='刪除';del.className='bv-danger';del.onclick=()=>{if(!confirm('確定刪除此標註及其備註？'))return;records.marks=records.marks.filter(x=>x.id!==r.id);expandedMarks.delete(r.id);saveRecords();renderMarks();decorate()};tools.append(del);row.append(tools);
 }marksPanel.append(row);
 }
 if(!records.marks.length){const empty=document.createElement('p');empty.textContent='尚無標註，請框選文字後選擇「標註化」。';marksPanel.append(empty)}
}
function getSelected(){const isEdit=source.style.display!=='none';if(isEdit){const text=source.value.slice(source.selectionStart,source.selectionEnd);return text.trim()?{text,offset:source.selectionStart}:null;}const sel=window.getSelection();if(!sel||sel.isCollapsed||!editor.contains(sel.anchorNode))return null;const text=sel.toString();if(!text.trim())return null;const raw=window.BVGetRawMarkdown?.()||'';return {text,offset:raw.indexOf(text)};}
function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{menu.hidden=true;fn()};menu.append(b)}
function showMenu(x,y,selected=null){lastSelection=selected||getSelected();if(!lastSelection)return false;menu.replaceChildren();button('標註',()=>addMark(lastSelection));button('目錄化',()=>{const text=lastSelection.text;records.toc.push({id:crypto.randomUUID(),text,offset:lastSelection.offset,name:text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate();});menu.hidden=false;menu.style.left=Math.max(8,Math.min(x,innerWidth-190))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-110))+'px';return true;}
function locate(r){
 const raw=window.BVGetRawMarkdown?.()||'';const at=resolveMarkOffset(r,raw);if(at<0)return false;
 if(source.style.display!=='none'){
  source.focus();source.setSelectionRange(at,at+r.text.length);
  const lines=raw.slice(0,at).split('\n').length;source.scrollTop=Math.max(0,(lines-4)*(parseFloat(getComputedStyle(source).lineHeight)||24));return true;
 }
 let target=editor.querySelector(`[data-mark-id="${CSS.escape(r.id)}"]`);
 if(!target){decorate();target=editor.querySelector(`[data-mark-id="${CSS.escape(r.id)}"]`)}
 if(target){target.scrollIntoView({block:'center',behavior:'smooth'});return true}
 const w=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.textContent.includes(r.text.trim().slice(0,100))){n.parentElement.scrollIntoView({block:'center',behavior:'smooth'});return true}}return false;
}
function resolveMarkOffset(r,raw){
 if(Number.isInteger(r.offset)&&raw.slice(r.offset,r.offset+r.text.length)===r.text)return r.offset;
 let pos=-1,best=-1,score=-1;
 while((pos=raw.indexOf(r.text,pos+1))>=0){let n=0;const before=raw.slice(Math.max(0,pos-(r.before||'').length),pos);const after=raw.slice(pos+r.text.length,pos+r.text.length+(r.after||'').length);if(r.before&&before===r.before)n+=2;if(r.after&&after===r.after)n+=2;if(n>score){score=n;best=pos}}
 return score>0?best:-1;
}
function renderPanel(){panel.replaceChildren();const heading=document.createElement('div');heading.className='toc-heading';heading.textContent='目錄';const batch=document.createElement('button');batch.textContent=batchMode?'完成選取':'批量選取';batch.onclick=()=>{batchMode=!batchMode;if(!batchMode)chosen.clear();renderPanel()};heading.append(batch);const make=document.createElement('button');make.textContent='目錄化';make.onclick=()=>{const selected=getSelected()||cachedSelection;if(!selected)return alert('請先在文件中框選文字');records.toc.push({id:crypto.randomUUID(),text:selected.text,offset:selected.offset,name:selected.text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate()};heading.append(make);const annotate=document.createElement('button');annotate.textContent='標註';annotate.title='將目前選取文字標註為黃底黑字';annotate.onclick=()=>addMark(getSelected()||cachedSelection);heading.append(annotate);const close=document.createElement('button');close.textContent='×';close.onclick=()=>panel.hidden=true;heading.append(close);panel.append(heading);
if(batchMode){const tools=document.createElement('div');tools.className='toc-batch-tools';const all=document.createElement('button');all.textContent='全選';all.onclick=()=>{records.toc.forEach(r=>chosen.add(r.id));renderPanel()};tools.append(all);const del=document.createElement('button');del.textContent=`刪除所選 (${chosen.size})`;del.className='bv-danger';del.disabled=!chosen.size;del.onclick=()=>{showPopup(del,'批量刪除目錄',`確定刪除 ${chosen.size} 個目錄？`,[['確認刪除',()=>{records.toc=records.toc.filter(r=>!chosen.has(r.id));chosen.clear();saveRecords();renderPanel();decorate()},true]])};tools.append(del);panel.append(tools)}
for(const r of records.toc){const row=document.createElement('div');row.className='toc-entry';if(batchMode){const check=document.createElement('input');check.type='checkbox';check.checked=chosen.has(r.id);check.onchange=()=>{check.checked?chosen.add(r.id):chosen.delete(r.id);renderPanel()};row.append(check)}const name=document.createElement('span');name.textContent=r.name;row.append(name);row.onclick=e=>{if(batchMode){if(e.target.tagName!=='INPUT'){chosen.has(r.id)?chosen.delete(r.id):chosen.add(r.id);renderPanel()}return}locate(r);panel.hidden=true};const actions=()=>{showPopup(row,'目錄名稱',r.name,[['儲存',value=>{if(value.trim())r.name=value.trim();saveRecords();renderPanel();decorate()}],['刪除',()=>{records.toc=records.toc.filter(x=>x!==r);chosen.delete(r.id);saveRecords();renderPanel();decorate()},true]])};row.oncontextmenu=e=>{e.preventDefault();actions()};let timer;row.addEventListener('touchstart',()=>{timer=setTimeout(actions,550)},{passive:true});row.addEventListener('touchend',()=>clearTimeout(timer));row.addEventListener('touchmove',()=>clearTimeout(timer));panel.append(row)}if(!records.toc.length){const empty=document.createElement('p');empty.textContent='目前沒有目錄。選取文字後使用「目錄化」。';panel.append(empty)}}
function decorate(){
 if(source.style.display!=='none')return;
 editor.querySelectorAll('span.bv-toc-underline,span.bv-mark-highlight').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));editor.normalize();
 function wrapText(needle,className,id,occurrence){
  if(!needle||needle.includes('\n'))return false;
  const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let n,count=0;
  while(n=walker.nextNode()){
   if(n.parentElement?.closest('pre,code,svg,.katex,.bv-toc-underline,.bv-mark-highlight'))continue;
   let start=0,idx;
   while((idx=n.textContent.indexOf(needle,start))>=0){
    if(count++===occurrence){const range=document.createRange();range.setStart(n,idx);range.setEnd(n,idx+needle.length);const span=document.createElement('span');span.className=className;if(id){span.dataset.markId=id;span.style.setProperty('color','#000000','important');span.style.setProperty('-webkit-text-fill-color','#000000','important');span.style.setProperty('background-color','#ffe45c','important');}range.surroundContents(span);return true}
    start=idx+Math.max(1,needle.length);
   }
  }return false;
 }
 for(const r of records.toc)wrapText(r.text.trim(),'bv-toc-underline',null,0);
 const raw=window.BVGetRawMarkdown?.()||'';
 for(const r of records.marks){
  const at=resolveMarkOffset(r,raw);if(at<0)continue;
  let count=0,pos=-1;while((pos=raw.indexOf(r.text,pos+1))>=0&&pos<at)count++;
  if(!wrapText(r.text,'bv-mark-highlight',r.id,count))wrapText(r.text,'bv-mark-highlight',r.id,0);
 }
}
window.BVFlushFileRecords=()=>{if(!activeKey)return Promise.resolve();return window.BVPutFileRecords?.(activeKey,structuredClone(records))||Promise.resolve()};
window.BVActivateFileRecords=(key)=>{activeKey=key;panel.hidden=true;marksPanel.hidden=true;popup.hidden=true;hideMarkFloat(true);batchMode=false;chosen.clear();readRecords()};
window.BVRefreshFileRecords=()=>{if(!activeKey)return;reconcile();renderPanel();renderMarks();if(source.style.display==='none')requestAnimationFrame(decorate)};
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
 button('標記列表',()=>{marksPanel.hidden=!marksPanel.hidden;if(!marksPanel.hidden){panel.hidden=true;renderMarks()}});
 if(selected){
  lastSelection={...selected};
  button('標註',()=>addMark(lastSelection));button('目錄化',()=>{const text=lastSelection.text;records.toc.push({id:crypto.randomUUID(),text,offset:lastSelection.offset,name:text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate()});
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
 button('刪除文本',()=>{
  const current=lastSelection||selected;
  if(!current?.text)return alert('請先框選要刪除的文字');
  const raw=window.BVGetRawMarkdown?.()||'';
  const at=current.offset>=0&&raw.slice(current.offset,current.offset+current.text.length)===current.text?current.offset:raw.indexOf(current.text);
  if(at<0)return alert('無法在原始 Markdown 找到選取文字，請切換編輯模式後重新選取');
  showPopup(selectionAnchor(),'刪除所選文本',current.text,[['確認刪除',()=>{
   const updated=raw.slice(0,at)+raw.slice(at+current.text.length);
   if(source.style.display!=='none'){source.value=updated;source.dispatchEvent(new Event('input',{bubbles:true}));source.focus();source.setSelectionRange(at,at)}
   else window.BVSetRawMarkdown?.(updated);
   document.querySelector('#status').textContent='已刪除選取文本，請 Commit 儲存';
  },true]]);
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
document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.hidden=true;if(!panel.contains(e.target)&&e.target!==tocButton&&!popup.contains(e.target))panel.hidden=true;if(!marksPanel.contains(e.target)&&!menu.contains(e.target))marksPanel.hidden=true});
editor.addEventListener('input',()=>setTimeout(window.BVRefreshFileRecords,100));source.addEventListener('input',()=>setTimeout(window.BVRefreshFileRecords,100));
})();
