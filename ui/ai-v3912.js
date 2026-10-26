import {addDocument,documents,removeDocument,clearDocuments,hybridSearch} from '../ai-rag/rag-core.js';
import {artifactZip,saveBlob} from '../ai-artifacts/artifact-core.js';
const $=id=>document.getElementById(id);const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const active=()=>document.body.classList.contains('ai-active')&&!$('ai-chat-page')?.hidden;
const status=(s)=>{if($('bv3912-status'))$('bv3912-status').textContent=s};
const download=(name,text)=>saveBlob(new Blob([text],{type:'text/markdown;charset=utf-8'}),name.replace(/[\\/:*?"<>|]/g,'_'));
let results=[],selection=new Set(),ragEnabled=false,attachmentURLs=new Map();
const toolbar=$('ai-header-tools'),directory=$('ai-header-directory');
if(!toolbar||!directory)throw Error('AI toolbar not found');
const btn=el('button','▤ 知識庫 (RAG)');btn.id='bv3912-rag-button';btn.type='button';directory.parentElement.after(btn);
const panel=el('aside');panel.id='bv3912-rag-panel';panel.hidden=true;panel.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><strong>本地知識庫 (RAG)</strong><button id="bv3912-close" type="button">✕</button></div><p>文件只儲存在此瀏覽器；搜尋內容需手動加入對話。未啟用向量模型時使用關鍵字搜尋。</p><label>選擇文件（MD、TXT、JSON）<input id="bv3912-files" type="file" multiple accept=".md,.txt,.json"></label><div class="bv-row"><button id="bv3912-index">建立索引</button><button id="bv3912-clear">清除索引</button></div><label>搜尋文件<input id="bv3912-query" placeholder="輸入要搜尋的概念或關鍵字"></label><div class="bv-row"><button id="bv3912-search">搜尋</button><button id="bv3912-context">引用到提問</button><button id="bv3912-export">下載搜尋結果 ZIP</button></div><div id="bv3912-status" role="status">尚未搜尋</div><div id="bv3912-rag-results"></div><div id="bv3912-docs"></div>`;document.body.append(panel);
btn.onclick=()=>{if(!active())return;panel.hidden=!panel.hidden;if(!panel.hidden)refreshDocs()};$('bv3912-close').onclick=()=>panel.hidden=true;
function syncVisibility(){btn.hidden=!active();if(!active())panel.hidden=true}new MutationObserver(syncVisibility).observe(document.body,{attributes:true,attributeFilter:['class']});setInterval(syncVisibility,1200);syncVisibility();
async function refreshDocs(){const list=await documents();const box=$('bv3912-docs');box.replaceChildren(el('h4',`已索引文件（${list.length}）`));for(const d of list){const row=el('div',d.name+'　');const remove=el('button','移除');remove.onclick=async()=>{await removeDocument(d.id);refreshDocs()};row.append(remove);box.append(row)}}
$('bv3912-index').onclick=async()=>{try{const files=[...$('bv3912-files').files];if(!files.length)return status('請先選擇文件');for(const f of files){if(f.size>2e6)throw Error(f.name+' 超過 2MB 文字索引限制');await addDocument(f.name,await f.text())}status(`已建立 ${files.length} 份文件索引`);refreshDocs()}catch(e){status('索引失敗：'+e.message)}};
$('bv3912-clear').onclick=async()=>{if(!confirm('確定清除這個瀏覽器的全部 RAG 索引？'))return;await clearDocuments();results=[];status('索引已清除');refreshDocs()};
$('bv3912-search').onclick=async()=>{try{const q=$('bv3912-query').value.trim();if(!q)return status('請輸入搜尋詞');const out=await hybridSearch(q,8);results=out.results;$('bv3912-rag-results').textContent=results.map((r,i)=>`[${i+1}] ${r.name} (${r.start}-${r.end})\n${r.text.slice(0,450)}`).join('\n\n---\n\n');status(`找到 ${results.length} 個片段；模式：${out.mode}（非語意向量搜尋）`)}catch(e){status('搜尋失敗：'+e.message)}};
$('bv3912-context').onclick=()=>{if(!results.length)return status('請先搜尋');const input=$('ai-message-input');if(!input)return;const ctx='\n\n以下為本地文件檢索結果，請根據來源回答並引用文件名稱：\n'+results.slice(0,5).map((r,i)=>`[來源${i+1}: ${r.name} ${r.start}-${r.end}]\n${r.text.slice(0,1100)}`).join('\n\n');input.value+=ctx;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();status('已將引用片段加入提問，送出前請確認內容及隱私')};
$('bv3912-export').onclick=async()=>{try{const md=results.map(r=>`## ${r.name} (${r.start}-${r.end})\n\n${r.text}`).join('\n\n');saveBlob(await artifactZip([{path:'rag-results.md',content:md}]),'BVNote_RAG_Results.zip');status('已匯出 ZIP')}catch(e){status('匯出失敗：'+e.message)}};
// Explorer: selection is kept in memory, never changes the existing chat store directly.
const explorer=$('ai-chat-list'),bulk=el('div');bulk.id='bv3912-bulk';const count=el('span','已選 0 項');const selectAll=el('button','全選顯示區塊'),clearSel=el('button','取消選取'),deleteSel=el('button','批量刪除'),dlSel=el('button','下載選取區塊');bulk.append(count,selectAll,clearSel,deleteSel,dlSel);explorer.before(bulk);
function keyFor(node){const tree=node.closest('.ai-ui-chat-tree');return (tree?.querySelector('summary .node-label')?.textContent||'')+'::'+node.textContent.trim()}
function blockNodes(){return [...explorer.querySelectorAll('.ai-block-node')]}
function updateChecks(){for(const node of blockNodes()){if(node.querySelector('.bv3912-check'))continue;const check=el('input');check.type='checkbox';check.className='bv3912-check';check.setAttribute('aria-label','選取 Q/A Block');check.checked=selection.has(keyFor(node));check.onclick=e=>{e.stopPropagation();const k=keyFor(node);if(check.checked)selection.add(k);else selection.delete(k);count.textContent=`已選 ${selection.size} 項`};node.prepend(check)}count.textContent=`已選 ${selection.size} 項`}
new MutationObserver(()=>queueMicrotask(updateChecks)).observe(explorer,{childList:true,subtree:true});updateChecks();
selectAll.onclick=()=>{for(const n of blockNodes())selection.add(keyFor(n));for(const n of blockNodes())n.querySelector('input.bv3912-check').checked=true;count.textContent=`已選 ${selection.size} 項`};clearSel.onclick=()=>{selection.clear();updateChecks();for(const n of blockNodes())n.querySelector('input.bv3912-check').checked=false;count.textContent='已選 0 項'};
function chatRecords(){try{return JSON.parse(localStorage.getItem('bvnote-ai-chats-v358')||'[]')}catch{return []}}
function selectedRecords(){const chats=chatRecords(),found=[];for(const chat of chats){for(let i=0;i<chat.blocks.length;i++){const b=chat.blocks[i],roleCount=chat.blocks.slice(0,i+1).filter(x=>x.role===b.role).length;const label=`${b.role}${roleCount} · ${b.text.replace(/\s+/g,' ').slice(0,28)}`;if(selection.has('▣ '+chat.title+'::'+label))found.push({chat,i,b})}}return found}
function recordMD(rec){return `# ${rec.chat.title}\n\n## ${rec.b.role} ${rec.i+1}\n\n${rec.b.text}\n`}
dlSel.onclick=async()=>{const found=selectedRecords();if(!found.length)return alert('請先勾選區塊');try{if(found.length===1){download(`QA_${found[0].i+1}.md`,recordMD(found[0]));return}const zip=await artifactZip(found.map((r,i)=>({path:`QA_${i+1}.md`,content:recordMD(r)})));saveBlob(zip,'BVNote_QA_Blocks.zip')}catch(e){alert(e.message)}};
deleteSel.onclick=()=>{const found=selectedRecords();if(!found.length)return alert('請先勾選區塊');if(!confirm(`確定永久刪除 ${found.length} 個 Q/A 區塊？請先備份。`))return;const chats=chatRecords();if(!Array.isArray(chats)||!chats.length||found.some(r=>!chats.some(c=>c.id===r.chat.id))){alert('聊天資料格式無法驗證，已取消刪除');return}for(const r of found.sort((a,b)=>b.i-a.i)){const c=chats.find(x=>x.id===r.chat.id);if(c&&c.blocks[r.i]?.text===r.b.text)c.blocks.splice(r.i,1)}localStorage.setItem('bvnote-ai-chats-v358',JSON.stringify(chats));selection.clear();alert('已寫入本地資料。請重新整理頁面以同步 AI Explorer。');location.reload()};
// Explorer context menu: right-click single Q/A block, and multi-select operations.
const menu=el('div');menu.style.cssText='position:fixed;z-index:9300;background:#1b2a40;border:1px solid #6a84ab;padding:8px;border-radius:9px;display:none';const menuDownload=el('button','下載此 Q/A Block (.md)'),menuDelete=el('button','刪除已選區塊');menu.append(menuDownload,menuDelete);document.body.append(menu);let contextNode=null;
explorer.addEventListener('contextmenu',e=>{const n=e.target.closest('.ai-block-node');if(!n)return;e.preventDefault();e.stopImmediatePropagation();contextNode=n;menu.style.left=Math.min(e.clientX,innerWidth-220)+'px';menu.style.top=Math.min(e.clientY,innerHeight-110)+'px';menu.style.display='block'},true);
document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.style.display='none'});menuDownload.onclick=()=>{selection.clear();selection.add(keyFor(contextNode));dlSel.click();selection.clear();menu.style.display='none'};menuDelete.onclick=()=>{selection.add(keyFor(contextNode));deleteSel.click();menu.style.display='none'};
// Fullscreen editor and inline image support for remote URLs/data URLs, with no raw HTML injection.
const thread=$('ai-ui-thread');function decorate(){for(const card of thread.querySelectorAll('.ai-ui-block')){const actions=card.querySelector('.ai-block-actions');if(!actions||actions.querySelector('.bv3912-fullscreen-toggle'))continue;const full=el('button','⛶ 展開編輯','bv3912-fullscreen-toggle');full.type='button';full.onclick=()=>{const on=card.classList.toggle('bv3912-fullscreen');full.textContent=on?'↙ 結束全頁':'⛶ 展開編輯';if(on&&!card.querySelector('.ai-ui-block-edit'))card.querySelector('.ai-ui-edit')?.click()};actions.prepend(full);const attach=el('button','📎 區塊附件');attach.type='button';const picker=el('input');picker.type='file';picker.multiple=true;picker.accept='.md,.txt,.jpg,.jpeg,.png,.webp,.pdf,.zip';picker.hidden=true;attach.onclick=()=>picker.click();actions.append(attach,picker);const box=el('div');box.className='bv3912-attachment';box.append(el('strong','區塊附件（儲存於此瀏覽器）'));card.append(box);picker.onchange=async()=>{for(const file of picker.files){if(file.size>20*1024*1024){alert(file.name+' 超過 20MB 限制');continue}await saveAttachment(card.id,file)}renderAttachments(card,box)};renderAttachments(card,box)}}
const DB='bvnote-block-files-v3912';function openDB(){return new Promise((ok,bad)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'key'});r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
async function saveAttachment(blockId,file){const db=await openDB(),key=location.pathname+':'+(explorer.querySelector('.ai-ui-chat-tree[open] summary .node-label')?.textContent||'chat')+':'+blockId+':'+file.name;return new Promise((ok,bad)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put({key,name:file.name,type:file.type,blob:file,blockId,created:Date.now()});t.oncomplete=()=>{db.close();ok()};t.onerror=()=>bad(t.error)})}
async function getAttachments(blockId){const db=await openDB();return new Promise((ok,bad)=>{const t=db.transaction('files','readonly'),r=t.objectStore('files').getAll();r.onsuccess=()=>{db.close();ok(r.result.filter(x=>x.blockId===blockId))};r.onerror=()=>bad(r.error)})}
// BVNOTE_CLOUD_QA_FIX3_20261026: delete the exact IndexedDB attachment by its primary key.
async function removeAttachment(key){
 const db=await openDB();return new Promise((ok,bad)=>{
  const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(key);
  tx.oncomplete=()=>{db.close();ok()};tx.onerror=()=>{db.close();bad(tx.error)};
  tx.onabort=()=>{db.close();bad(tx.error||new Error('Attachment delete aborted'))};
 });
}
async function renderAttachments(card,box){
 const entries=await getAttachments(card.id);if(!card.isConnected)return;
 for(const url of (box._bvAttachmentURLs||[]))URL.revokeObjectURL(url);
 const urls=[];box._bvAttachmentURLs=urls;
 box.replaceChildren(el('strong',`附件（${entries.length}）`));
 for(const item of entries){
  const row=el('div');row.className='bv-qa-attachment-row';
  const a=el('a','⬇ '+item.name);const url=URL.createObjectURL(item.blob);urls.push(url);
  a.href=url;a.download=item.name;row.append(a);
  const remove=el('button','移除');remove.type='button';remove.className='bv-qa-attachment-remove';
  remove.title='永久移除此 QA BLOCK 的附件';
  remove.style.cssText='margin-left:12px;padding:2px 8px;border:1px solid #b95a64;border-radius:5px;background:transparent;color:#ffb2b9;cursor:pointer';
  remove.onclick=async event=>{
   event.preventDefault();event.stopPropagation();
   if(!confirm('確定永久移除附件「'+item.name+'」？此操作無法復原。'))return;
   remove.disabled=true;
   try{await removeAttachment(item.key);await renderAttachments(card,box)}
   catch(err){remove.disabled=false;alert('附件移除失敗：'+err.message)}
  };
  row.append(remove);
  if(item.type?.startsWith('image/')){const img=el('img');img.src=url;img.alt=item.name;row.append(img)}
  box.append(row);
 }
}
new MutationObserver(()=>queueMicrotask(decorate)).observe(thread,{childList:true,subtree:false});decorate();
// Default model: UI selection, server may enforce its own supported model.
const model=$('ai-model-select');if(model){const setDefault=()=>{if(!sessionStorage.getItem('bv3912-model-set')){model.value='gpt-5';model.dispatchEvent(new Event('change',{bubbles:true}));sessionStorage.setItem('bv3912-model-set','1')}};setTimeout(setDefault,500)}
// Long replies: explicit continuation button, not an unsupported promise of unlimited output.
const continueBtn=el('button','↻ 繼續未完成的回答');continueBtn.type='button';continueBtn.title='若模型回答因長度限制而截斷，手動要求從中斷處接續';const compose=$('ai-chat-composer');compose?.append(continueBtn);continueBtn.onclick=()=>{const input=$('ai-message-input');input.value='請從上一則回答中斷的位置繼續，避免重複，直到完成。';input.focus()};
