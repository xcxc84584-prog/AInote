/* AREA A-DC1909B7 START: toc.js */
// AREA A01 START: TOCAndAnnotations | File: toc.js
'use strict';
(()=>{/* BLOCK B-E19C6B9F87 START: AREA A-DC1909B7 */
const editor=document.querySelector('#editor'),source=document.querySelector('#source-editor'),main=document.querySelector('.workspace main');
const menu=document.createElement('div');menu.id='text-actions';menu.hidden=true;document.body.append(menu);
const panel=document.createElement('section');panel.id='toc-panel';panel.hidden=true;document.body.append(panel);
const tocButton=document.querySelector('#toc-toggle');
const marksPanel=document.createElement('section');marksPanel.id='marks-panel';marksPanel.hidden=true;document.body.append(marksPanel);
const popup=document.createElement('div');popup.id='bv-inline-popup';popup.hidden=true;document.body.append(popup);
let batchMode=false,chosen=new Set();const expandedMarks=new Set();
function showPopup(anchor,title,value,actions){/* BLOCK B-106A3C4514 START: AREA A-DC1909B7 */popup.replaceChildren();const h=document.createElement('div');h.className='bv-popup-title';h.textContent=title;popup.append(h);const field=document.createElement('textarea');field.rows=2;field.value=value||'';popup.append(field);const buttons=document.createElement('div');buttons.className='bv-popup-buttons';for(const [label,callback,danger] of actions){const b=document.createElement('button');b.textContent=label;if(danger)b.className='bv-danger';b.onclick=()=>{/* BLOCK B-EB90074BF4 START: AREA A-DC1909B7 */callback(field.value);popup.hidden=true/* BLOCK B-EB90074BF4 END. */};buttons.append(b)}const cancel=document.createElement('button');cancel.textContent='取消';cancel.onclick=()=>popup.hidden=true;buttons.append(cancel);popup.append(buttons);popup.hidden=false;const rect=anchor?.getBoundingClientRect?.()||{left:innerWidth/2,top:innerHeight/2,bottom:innerHeight/2};const w=Math.min(310,innerWidth-16);popup.style.width=w+'px';popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-w-8))+'px';popup.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-185))+'px';field.focus();field.select();/* BLOCK B-106A3C4514 END. */}
function selectionAnchor(){/* BLOCK B-66109493B0 START: AREA A-DC1909B7 */const sel=window.getSelection();if(sel?.rangeCount&&!sel.isCollapsed){const rect=sel.getRangeAt(0).getBoundingClientRect();if(rect.width||rect.height)return {getBoundingClientRect:()=>rect}}return source.style.display!=='none'?source:editor;/* BLOCK B-66109493B0 END. */}

let activeKey='',records={toc:[],notes:[],marks:[]},lastSelection=null;
const storeKey=()=>activeKey?'bv-note-annotations:'+activeKey:null;
async function saveRecords(){/* BLOCK B-DEEC7F36BA START: AREA A-DC1909B7 */
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
/* BLOCK B-DEEC7F36BA END. */}
function readRecords(){/* BLOCK B-6AAB45165C START: AREA A-DC1909B7 */try{records=window.BVGetFileRecords?.(activeKey)||JSON.parse(localStorage.getItem(storeKey())||'{"toc":[],"notes":[]}')}catch{records={toc:[],notes:[],marks:[]}}records.toc||=[];records.notes||=[];records.marks||=[];reconcile();renderPanel();renderMarks();decorate();/* BLOCK B-6AAB45165C END. */}
function reconcile(){/* BLOCK B-ABAA9E213E START: AREA A-DC1909B7 */const raw=window.BVGetRawMarkdown?.()||'';let changed=false;for(const kind of ['toc']){const old=records[kind].length;records[kind]=records[kind].filter(r=>r.text&&raw.includes(r.text));changed ||=old!==records[kind].length;}if(changed)saveRecords();/* BLOCK B-ABAA9E213E END. */}
function addMark(selected){/* BLOCK B-BE362D2FCD START: AREA A-DC1909B7 */
 if(!selected?.text?.trim())return alert('請先選取文字');
 const raw=window.BVGetRawMarkdown?.()||'';
 const at=selected.offset>=0&&raw.slice(selected.offset,selected.offset+selected.text.length)===selected.text?selected.offset:raw.indexOf(selected.text);
 if(at<0)return alert('找不到選取文字在 Markdown 原文中的位置，請切換原始碼模式選取');
 records.marks.push({id:crypto.randomUUID(),text:selected.text,offset:at,name:selected.text.trim().split('\n')[0].slice(0,80),note:'',before:raw.slice(Math.max(0,at-30),at),after:raw.slice(at+selected.text.length,at+selected.text.length+30)});
 saveRecords();renderMarks();decorate();
/* BLOCK B-BE362D2FCD END. */}
// Floating annotation note: starts at the upper-right and can be dragged by its header.
const markFloat=document.createElement('section');markFloat.id='bv-mark-float';markFloat.hidden=true;document.body.append(markFloat);
let floatPinned=false,floatMarkId=null;
function hideMarkFloat(force=false){/* BLOCK B-667824FFB3 START: AREA A-DC1909B7 */if(force||!floatPinned){markFloat.hidden=true;floatPinned=false;floatMarkId=null}/* BLOCK B-667824FFB3 END. */}
function showMarkFloat(r,edit=false){/* BLOCK B-9728E9608D START: AREA A-DC1909B7 */
 if(!r||(!edit&&!String(r.note||'').trim()))return;
 markFloat.replaceChildren();floatPinned=edit;floatMarkId=r.id;
 const head=document.createElement('div');head.className='bv-mark-float-head';
 const title=document.createElement('strong');title.textContent=edit?'編輯標註備註':'標註備註';head.append(title);
 const close=document.createElement('button');close.type='button';close.textContent='×';close.onclick=()=>hideMarkFloat(true);head.append(close);markFloat.append(head);
 const label=document.createElement('div');label.className='bv-mark-float-label';label.textContent=r.name||r.text;markFloat.append(label);
 if(edit){const area=document.createElement('textarea');area.rows=5;area.value=r.note||'';area.placeholder='輸入備註';markFloat.append(area);
 const actions=document.createElement('div');actions.className='bv-mark-float-actions';
 const save=document.createElement('button');save.textContent='儲存備註';save.onclick=()=>{/* BLOCK B-F01610D0CD START: AREA A-DC1909B7 */r.note=area.value;saveRecords();renderMarks();hideMarkFloat(true)/* BLOCK B-F01610D0CD END. */};actions.append(save);
 const cancel=document.createElement('button');cancel.textContent='取消';cancel.onclick=()=>hideMarkFloat(true);actions.append(cancel);markFloat.append(actions);
 }else{const note=document.createElement('div');note.className='bv-mark-float-note';note.textContent=r.note;markFloat.append(note)}
 markFloat.hidden=false;
 if(!markFloat.dataset.moved){markFloat.style.top='70px';markFloat.style.right='14px';markFloat.style.left='auto'}
/* BLOCK B-9728E9608D END. */}
let dragFloat=null;
markFloat.addEventListener('pointerdown',e=>{/* BLOCK B-06DC43FF76 START: AREA A-DC1909B7 */if(!e.target.closest('.bv-mark-float-head')||e.target.closest('button'))return;
 const rect=markFloat.getBoundingClientRect();dragFloat={id:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};markFloat.setPointerCapture(e.pointerId);e.preventDefault()/* BLOCK B-06DC43FF76 END. */});
markFloat.addEventListener('pointermove',e=>{/* BLOCK B-C62220D08D START: AREA A-DC1909B7 */if(!dragFloat||dragFloat.id!==e.pointerId)return;
 const x=Math.max(0,Math.min(innerWidth-markFloat.offsetWidth,e.clientX-dragFloat.dx));
 const y=Math.max(0,Math.min(innerHeight-markFloat.offsetHeight,e.clientY-dragFloat.dy));
 markFloat.style.left=x+'px';markFloat.style.top=y+'px';markFloat.style.right='auto';markFloat.dataset.moved='1'/* BLOCK B-C62220D08D END. */});
for(const ev of ['pointerup','pointercancel'])markFloat.addEventListener(ev,()=>dragFloat=null);
editor.addEventListener('pointerover',e=>{/* BLOCK B-E036182E42 START: AREA A-DC1909B7 */if(floatPinned)return;const span=e.target.closest?.('.bv-mark-highlight[data-mark-id]');if(!span)return;const r=records.marks.find(x=>x.id===span.dataset.markId);if(r?.note?.trim()&&floatMarkId!==r.id)showMarkFloat(r,false)/* BLOCK B-E036182E42 END. */});
editor.addEventListener('pointerout',e=>{/* BLOCK B-6E08E85149 START: AREA A-DC1909B7 */if(floatPinned)return;const span=e.target.closest?.('.bv-mark-highlight[data-mark-id]');if(span&&!span.contains(e.relatedTarget))hideMarkFloat()/* BLOCK B-6E08E85149 END. */});
editor.addEventListener('dblclick',e=>{/* BLOCK B-9A05B79098 START: AREA A-DC1909B7 */const span=e.target.closest?.('.bv-mark-highlight[data-mark-id]');if(!span)return;const r=records.marks.find(x=>x.id===span.dataset.markId);if(r){e.preventDefault();showMarkFloat(r,true)}/* BLOCK B-9A05B79098 END. */});
function downloadMarkList(){/* BLOCK B-680855BD77 START: AREA A-DC1909B7 */
 const name=(document.querySelector('#current-file-name')?.textContent||activeKey||'BV-Note').replace(/[\\/:*?"<>|]/g,'_');
 const clean=v=>String(v||'').replace(/\r/g,'').trim();
 const lines=['# 標記列表','',`來源文件：${name}`,'',`標記數量：${records.marks.length}`,''];
 records.marks.forEach((r,i)=>{/* BLOCK B-44AF0166BD START: AREA A-DC1909B7 */lines.push(`## ${i+1}. ${clean(r.name)||'未命名標註'}`,'',`> ${clean(r.text).replace(/\n/g,'\n> ')}`,'','**備註**','',clean(r.note)||'（無備註）','','---','')/* BLOCK B-44AF0166BD END. */});
 const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='標記列表.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
/* BLOCK B-680855BD77 END. */}
function renderMarks(){/* BLOCK B-55DD33FCA5 START: AREA A-DC1909B7 */
 marksPanel.replaceChildren();const head=document.createElement('div');head.className='toc-heading';
 const title=document.createElement('strong');title.textContent=`標記列表 (${records.marks.length})`;head.append(title);
 const close=document.createElement('button');close.textContent='×';close.onclick=()=>marksPanel.hidden=true;head.append(close);const download=document.createElement('button');download.textContent='下載列表 (.md)';download.onclick=downloadMarkList;head.insertBefore(download,close);marksPanel.append(head);
 const add=document.createElement('button');add.textContent='＋ 標註目前選取';add.onclick=()=>addMark(getSelected()||cachedSelection);marksPanel.append(add);
 for(const r of records.marks){const row=document.createElement('div');row.className='bv-mark-entry';
 const summary=document.createElement('div');summary.className='bv-mark-summary';summary.title='點擊詞卡可展開或收合';
 const toggle=document.createElement('button');toggle.className='bv-mark-toggle';toggle.textContent=(expandedMarks.has(r.id)?'▾ ':'▸ ')+(r.name||r.text.slice(0,80));toggle.title='展開／收合標註';toggle.setAttribute('aria-expanded',String(expandedMarks.has(r.id)));toggle.onclick=()=>{/* BLOCK B-13E1B31416 START: AREA A-DC1909B7 */expandedMarks.has(r.id)?expandedMarks.delete(r.id):expandedMarks.add(r.id);renderMarks()/* BLOCK B-13E1B31416 END. */};summary.append(toggle);
 const locateButton=document.createElement('button');locateButton.textContent='快速定位';locateButton.className='bv-mark-locate';locateButton.onclick=()=>{/* BLOCK B-09F766445D START: AREA A-DC1909B7 */if(!locate(r))alert('找不到標註位置，原文可能已被修改')/* BLOCK B-09F766445D END. */};summary.append(locateButton);row.append(summary);summary.addEventListener('click',e=>{/* BLOCK B-5582C6A5D3 START: AREA A-DC1909B7 */if(e.target.closest('.bv-mark-locate,.bv-mark-toggle'))return;toggle.click()/* BLOCK B-5582C6A5D3 END. */});
 if(expandedMarks.has(r.id)){
 const quote=document.createElement('div');quote.className='bv-mark-quote';quote.textContent=r.text;row.append(quote);
 const label=document.createElement('label');label.textContent='備註';row.append(label);
 const note=document.createElement('textarea');note.rows=2;note.value=r.note||'';note.placeholder='輸入此標註的備註';note.setAttribute('aria-label','標註備註');row.append(note);
 const tools=document.createElement('div');tools.className='bv-mark-tools';
 const save=document.createElement('button');save.textContent='儲存備註';save.onclick=()=>{/* BLOCK B-7D114A1E02 START: AREA A-DC1909B7 */r.note=note.value;saveRecords()/* BLOCK B-7D114A1E02 END. */};tools.append(save);
 const rename=document.createElement('button');rename.textContent='重新命名';rename.onclick=()=>showPopup(rename,'標註名稱',r.name,[['儲存',v=>{/* BLOCK B-C5566CF8E9 START: AREA A-DC1909B7 */if(v.trim())r.name=v.trim();saveRecords();renderMarks()/* BLOCK B-C5566CF8E9 END. */}]]);tools.append(rename);
 const del=document.createElement('button');del.textContent='刪除';del.className='bv-danger';del.onclick=()=>{/* BLOCK B-4E7507F960 START: AREA A-DC1909B7 */if(!confirm('確定刪除此標註及其備註？'))return;records.marks=records.marks.filter(x=>x.id!==r.id);expandedMarks.delete(r.id);saveRecords();renderMarks();decorate()/* BLOCK B-4E7507F960 END. */};tools.append(del);row.append(tools);
 }marksPanel.append(row);
 }
 if(!records.marks.length){const empty=document.createElement('p');empty.textContent='尚無標註，請框選文字後選擇「標註化」。';marksPanel.append(empty)}
/* BLOCK B-55DD33FCA5 END. */}
function getSelected(){/* BLOCK B-5336934BD2 START: AREA A-DC1909B7 */const isEdit=source.style.display!=='none';if(isEdit){const text=source.value.slice(source.selectionStart,source.selectionEnd);return text.trim()?{text,offset:source.selectionStart}:null;}const sel=window.getSelection();if(!sel||sel.isCollapsed||!editor.contains(sel.anchorNode))return null;const text=sel.toString();if(!text.trim())return null;const raw=window.BVGetRawMarkdown?.()||'';return {text,offset:raw.indexOf(text)};/* BLOCK B-5336934BD2 END. */}
function button(label,fn){/* BLOCK B-BD2D52ED00 START: AREA A-DC1909B7 */const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{/* BLOCK B-5B79FA3ED2 START: AREA A-DC1909B7 */menu.hidden=true;fn()/* BLOCK B-5B79FA3ED2 END. */};menu.append(b)/* BLOCK B-BD2D52ED00 END. */}
function showMenu(x,y,selected=null){/* BLOCK B-137E94266F START: AREA A-DC1909B7 */lastSelection=selected||getSelected();if(!lastSelection)return false;menu.replaceChildren();button('標註',()=>addMark(lastSelection));button('目錄化',()=>{/* BLOCK B-E255302F92 START: AREA A-DC1909B7 */const text=lastSelection.text;records.toc.push({id:crypto.randomUUID(),text,offset:lastSelection.offset,name:text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate();/* BLOCK B-E255302F92 END. */});menu.hidden=false;menu.style.left=Math.max(8,Math.min(x,innerWidth-190))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-110))+'px';return true;/* BLOCK B-137E94266F END. */}
function locate(r){/* BLOCK B-238EB0A909 START: AREA A-DC1909B7 */
 const raw=window.BVGetRawMarkdown?.()||'';const at=resolveMarkOffset(r,raw);if(at<0)return false;
 if(source.style.display!=='none'){
  source.focus();source.setSelectionRange(at,at+r.text.length);
  const lines=raw.slice(0,at).split('\n').length;source.scrollTop=Math.max(0,(lines-4)*(parseFloat(getComputedStyle(source).lineHeight)||24));return true;
 }
 let target=editor.querySelector(`[data-mark-id="${CSS.escape(r.id)}"]`);
 if(!target){decorate();target=editor.querySelector(`[data-mark-id="${CSS.escape(r.id)}"]`)}
 if(target){target.scrollIntoView({block:'center',behavior:'smooth'});return true}
 const w=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.textContent.includes(r.text.trim().slice(0,100))){n.parentElement.scrollIntoView({block:'center',behavior:'smooth'});return true}}return false;
/* BLOCK B-238EB0A909 END. */}
function resolveMarkOffset(r,raw){/* BLOCK B-1BE99B0A1E START: AREA A-DC1909B7 */
 if(Number.isInteger(r.offset)&&raw.slice(r.offset,r.offset+r.text.length)===r.text)return r.offset;
 let pos=-1,best=-1,score=-1;
 while((pos=raw.indexOf(r.text,pos+1))>=0){let n=0;const before=raw.slice(Math.max(0,pos-(r.before||'').length),pos);const after=raw.slice(pos+r.text.length,pos+r.text.length+(r.after||'').length);if(r.before&&before===r.before)n+=2;if(r.after&&after===r.after)n+=2;if(n>score){score=n;best=pos}}
 return score>0?best:-1;
/* BLOCK B-1BE99B0A1E END. */}
function renderPanel(){/* BLOCK B-AAA7D4B501 START: AREA A-DC1909B7 */panel.replaceChildren();const heading=document.createElement('div');heading.className='toc-heading';heading.textContent='目錄';const batch=document.createElement('button');batch.textContent=batchMode?'完成選取':'批量選取';batch.onclick=()=>{/* BLOCK B-58A24A720D START: AREA A-DC1909B7 */batchMode=!batchMode;if(!batchMode)chosen.clear();renderPanel()/* BLOCK B-58A24A720D END. */};heading.append(batch);const make=document.createElement('button');make.textContent='目錄化';make.onclick=()=>{/* BLOCK B-F107C43CB9 START: AREA A-DC1909B7 */const selected=getSelected()||cachedSelection;if(!selected)return alert('請先在文件中框選文字');records.toc.push({id:crypto.randomUUID(),text:selected.text,offset:selected.offset,name:selected.text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate()/* BLOCK B-F107C43CB9 END. */};heading.append(make);const annotate=document.createElement('button');annotate.textContent='標註';annotate.title='將目前選取文字標註為黃底黑字';annotate.onclick=()=>addMark(getSelected()||cachedSelection);heading.append(annotate);const close=document.createElement('button');close.textContent='×';close.onclick=()=>panel.hidden=true;heading.append(close);panel.append(heading);
if(batchMode){const tools=document.createElement('div');tools.className='toc-batch-tools';const all=document.createElement('button');all.textContent='全選';all.onclick=()=>{/* BLOCK B-91B6E952A4 START: AREA A-DC1909B7 */records.toc.forEach(r=>chosen.add(r.id));renderPanel()/* BLOCK B-91B6E952A4 END. */};tools.append(all);const del=document.createElement('button');del.textContent=`刪除所選 (${chosen.size})`;del.className='bv-danger';del.disabled=!chosen.size;del.onclick=()=>{/* BLOCK B-D5CC37DA4A START: AREA A-DC1909B7 */showPopup(del,'批量刪除目錄',`確定刪除 ${chosen.size} 個目錄？`,[['確認刪除',()=>{/* BLOCK B-81298AB033 START: AREA A-DC1909B7 */records.toc=records.toc.filter(r=>!chosen.has(r.id));chosen.clear();saveRecords();renderPanel();decorate()/* BLOCK B-81298AB033 END. */},true]])/* BLOCK B-D5CC37DA4A END. */};tools.append(del);panel.append(tools)}
for(const r of records.toc){const row=document.createElement('div');row.className='toc-entry';if(batchMode){const check=document.createElement('input');check.type='checkbox';check.checked=chosen.has(r.id);check.onchange=()=>{/* BLOCK B-1D332FCFDB START: AREA A-DC1909B7 */check.checked?chosen.add(r.id):chosen.delete(r.id);renderPanel()/* BLOCK B-1D332FCFDB END. */};row.append(check)}const name=document.createElement('span');name.textContent=r.name;row.append(name);row.onclick=e=>{/* BLOCK B-8514BA15EE START: AREA A-DC1909B7 */if(batchMode){if(e.target.tagName!=='INPUT'){chosen.has(r.id)?chosen.delete(r.id):chosen.add(r.id);renderPanel()}return}locate(r);panel.hidden=true/* BLOCK B-8514BA15EE END. */};const actions=()=>{/* BLOCK B-FA26E44B9B START: AREA A-DC1909B7 */showPopup(row,'目錄名稱',r.name,[['儲存',value=>{/* BLOCK B-83D42D5232 START: AREA A-DC1909B7 */if(value.trim())r.name=value.trim();saveRecords();renderPanel();decorate()/* BLOCK B-83D42D5232 END. */}],['刪除',()=>{/* BLOCK B-536303930E START: AREA A-DC1909B7 */records.toc=records.toc.filter(x=>x!==r);chosen.delete(r.id);saveRecords();renderPanel();decorate()/* BLOCK B-536303930E END. */},true]])/* BLOCK B-FA26E44B9B END. */};row.oncontextmenu=e=>{/* BLOCK B-7A2C2F8CFA START: AREA A-DC1909B7 */e.preventDefault();actions()/* BLOCK B-7A2C2F8CFA END. */};let timer;row.addEventListener('touchstart',()=>{/* BLOCK B-65C45A9EDB START: AREA A-DC1909B7 */timer=setTimeout(actions,550)/* BLOCK B-65C45A9EDB END. */},{passive:true});row.addEventListener('touchend',()=>clearTimeout(timer));row.addEventListener('touchmove',()=>clearTimeout(timer));panel.append(row)}if(!records.toc.length){const empty=document.createElement('p');empty.textContent='目前沒有目錄。選取文字後使用「目錄化」。';panel.append(empty)}/* BLOCK B-AAA7D4B501 END. */}
function decorate(){/* BLOCK B-527C258B4F START: AREA A-DC1909B7 */
 if(source.style.display!=='none')return;
 editor.querySelectorAll('span.bv-toc-underline,span.bv-mark-highlight').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));editor.normalize();
 function wrapText(needle,className,id,occurrence){/* BLOCK B-63C0089A24 START: AREA A-DC1909B7 */
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
 /* BLOCK B-63C0089A24 END. */}
 for(const r of records.toc)wrapText(r.text.trim(),'bv-toc-underline',null,0);
 const raw=window.BVGetRawMarkdown?.()||'';
 for(const r of records.marks){
  const at=resolveMarkOffset(r,raw);if(at<0)continue;
  let count=0,pos=-1;while((pos=raw.indexOf(r.text,pos+1))>=0&&pos<at)count++;
  if(!wrapText(r.text,'bv-mark-highlight',r.id,count))wrapText(r.text,'bv-mark-highlight',r.id,0);
 }
/* BLOCK B-527C258B4F END. */}
window.BVFlushFileRecords=()=>{/* BLOCK B-FDD3D3DD2D START: AREA A-DC1909B7 */if(!activeKey)return Promise.resolve();return window.BVPutFileRecords?.(activeKey,structuredClone(records))||Promise.resolve()/* BLOCK B-FDD3D3DD2D END. */};
window.BVActivateFileRecords=(key)=>{/* BLOCK B-BB11886D8A START: AREA A-DC1909B7 */activeKey=key;panel.hidden=true;marksPanel.hidden=true;popup.hidden=true;hideMarkFloat(true);batchMode=false;chosen.clear();readRecords()/* BLOCK B-BB11886D8A END. */};
window.BVRefreshFileRecords=()=>{/* BLOCK B-7FDEF4F4CC START: AREA A-DC1909B7 */if(!activeKey)return;reconcile();renderPanel();renderMarks();if(source.style.display==='none')requestAnimationFrame(decorate)/* BLOCK B-7FDEF4F4CC END. */};
tocButton.onclick=()=>{/* BLOCK B-6B8068D6F2 START: AREA A-DC1909B7 */panel.hidden=!panel.hidden;if(!panel.hidden)renderPanel()/* BLOCK B-6B8068D6F2 END. */};
// Text actions are accessible exclusively from Settings → 文本工具.
// Capture the selection before focus shifts to the toolbar (important for mobile).
let cachedSelection=null;
function rememberSelection(){/* BLOCK B-36CA2C3FA8 START: AREA A-DC1909B7 */const selection=getSelected();if(selection)cachedSelection={...selection};/* BLOCK B-36CA2C3FA8 END. */}
for(const el of [editor,source]){
 el.addEventListener('mouseup',rememberSelection);
 el.addEventListener('keyup',rememberSelection);
 el.addEventListener('touchend',()=>setTimeout(rememberSelection,0),{passive:true});
}
const settingsButton=document.querySelector('#settings-toggle');
settingsButton?.addEventListener('pointerdown',rememberSelection,{capture:true});
const imagePicker=document.querySelector('#insert-image-file');
let imageInsertionPosition=null;
function imageMarkdown(file,data){/* BLOCK B-61E7B7CE63 START: AREA A-DC1909B7 */const safe=file.name.replace(/[\[\]\n\r]/g,' ');return `![${safe}](${data})`;/* BLOCK B-61E7B7CE63 END. */}
async function insertSelectedImage(file){/* BLOCK B-7CBB04B3DA START: AREA A-DC1909B7 */
 if(!file||!file.type.startsWith('image/'))return;
 if(file.size>8*1024*1024&&!confirm('圖片超過 8MB，嵌入 Markdown 後文件會變大。繼續？'))return;
 try{
  const data=await new Promise((resolve,reject)=>{/* BLOCK B-BD5532637E START: AREA A-DC1909B7 */const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)/* BLOCK B-BD5532637E END. */});
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
/* BLOCK B-7CBB04B3DA END. */}
imagePicker?.addEventListener('change',async()=>{/* BLOCK B-C78D432EA4 START: AREA A-DC1909B7 */const file=imagePicker.files?.[0];imagePicker.value='';await insertSelectedImage(file)/* BLOCK B-C78D432EA4 END. */});
const textTools=document.querySelector('#settings-text-tools');
textTools?.addEventListener('click',()=>{/* BLOCK B-A276FECD4B START: AREA A-DC1909B7 */
 const selected=getSelected()||cachedSelection;
 menu.replaceChildren();
 button('標記列表',()=>{/* BLOCK B-6BE25E5A35 START: AREA A-DC1909B7 */marksPanel.hidden=!marksPanel.hidden;if(!marksPanel.hidden){panel.hidden=true;renderMarks()}/* BLOCK B-6BE25E5A35 END. */});
 if(selected){
  lastSelection={...selected};
  button('標註',()=>addMark(lastSelection));button('目錄化',()=>{/* BLOCK B-1ED1A26E00 START: AREA A-DC1909B7 */const text=lastSelection.text;records.toc.push({id:crypto.randomUUID(),text,offset:lastSelection.offset,name:text.split('\n')[0].trim().slice(0,100)||'未命名目錄'});saveRecords();renderPanel();decorate()/* BLOCK B-1ED1A26E00 END. */});
 }
 button('插入文本',()=>{/* BLOCK B-136F78D897 START: AREA A-DC1909B7 */
  const current=lastSelection||selected;
  if(!current?.text)return alert('請先框選要定位的文字');
  const raw=window.BVGetRawMarkdown?.()||'';
  const start=current.offset>=0&&raw.slice(current.offset,current.offset+current.text.length)===current.text?current.offset:raw.indexOf(current.text);
  if(start<0)return alert('找不到框選的原始文字，請重新選取');
  const end=start+current.text.length;
  showPopup(selectionAnchor(),'插入文本（選取段落最後一字之後）','',[["插入",value=>{/* BLOCK B-80A141E30C START: AREA A-DC1909B7 */
   const updated=raw.slice(0,end)+value+raw.slice(end);
   if(source.style.display!=='none'){
    source.value=updated;source.dispatchEvent(new Event('input',{bubbles:true}));source.focus();source.setSelectionRange(end+value.length,end+value.length);
   }else{
    window.BVSetRawMarkdown?.(updated);
   }
   document.querySelector('#status').textContent='文本已插入，請 Commit 儲存';
  /* BLOCK B-80A141E30C END. */}]]);
 /* BLOCK B-136F78D897 END. */});
 button('刪除文本',()=>{/* BLOCK B-000CFD49D5 START: AREA A-DC1909B7 */
  const current=lastSelection||selected;
  if(!current?.text)return alert('請先框選要刪除的文字');
  const raw=window.BVGetRawMarkdown?.()||'';
  const at=current.offset>=0&&raw.slice(current.offset,current.offset+current.text.length)===current.text?current.offset:raw.indexOf(current.text);
  if(at<0)return alert('無法在原始 Markdown 找到選取文字，請切換編輯模式後重新選取');
  showPopup(selectionAnchor(),'刪除所選文本',current.text,[['確認刪除',()=>{/* BLOCK B-5962B3823F START: AREA A-DC1909B7 */
   const updated=raw.slice(0,at)+raw.slice(at+current.text.length);
   if(source.style.display!=='none'){source.value=updated;source.dispatchEvent(new Event('input',{bubbles:true}));source.focus();source.setSelectionRange(at,at)}
   else window.BVSetRawMarkdown?.(updated);
   document.querySelector('#status').textContent='已刪除選取文本，請 Commit 儲存';
  /* BLOCK B-5962B3823F END. */},true]]);
 /* BLOCK B-000CFD49D5 END. */});
 button('插入圖片',()=>{/* BLOCK B-96F5A55177 START: AREA A-DC1909B7 */
  if(source.style.display!=='none')imageInsertionPosition=source.selectionStart;
  else{
   const raw=window.BVGetRawMarkdown?.()||'';
   if(selected?.offset>=0){const end=selected.offset+selected.text.length;const nextLine=raw.indexOf('\n',end);imageInsertionPosition=nextLine<0?raw.length:nextLine+1;}
   else imageInsertionPosition=raw.length;
  }
  imagePicker?.click();
 /* BLOCK B-96F5A55177 END. */});
 const r=textTools.getBoundingClientRect();menu.hidden=false;menu.style.left=Math.max(8,Math.min(r.left,innerWidth-190))+'px';menu.style.top=Math.max(8,Math.min(r.bottom+8,innerHeight-150))+'px';
/* BLOCK B-A276FECD4B END. */});
document.addEventListener('pointerdown',e=>{/* BLOCK B-F040BDBCD5 START: AREA A-DC1909B7 */if(!menu.contains(e.target))menu.hidden=true;if(!panel.contains(e.target)&&e.target!==tocButton&&!popup.contains(e.target))panel.hidden=true;if(!marksPanel.contains(e.target)&&!menu.contains(e.target))marksPanel.hidden=true/* BLOCK B-F040BDBCD5 END. */});
editor.addEventListener('input',()=>setTimeout(window.BVRefreshFileRecords,100));source.addEventListener('input',()=>setTimeout(window.BVRefreshFileRecords,100));
/* BLOCK B-E19C6B9F87 END. */})();
// AREA A01 END: TOCAndAnnotations

/* AREA A-DC1909B7 END. */
