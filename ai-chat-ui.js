// AREA A09 START: AIChatManager | File: ai-chat-ui.js
/* sEAPP v3.5.8: ChatRegistry, ChatBlocks, AIRequest, MarkdownRenderer reused from renderer.js/app.js */
(()=>{'use strict';const $=id=>document.getElementById(id),body=document.body;let open=true,selected=null,chats=[],apiKey='',sending=false;let draggedId=null;let contextId=null;let blockContext=null;const expanded=new Set();
const STORAGE='bvnote-ai-chats-v358';try{chats=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(!Array.isArray(chats))chats=[]}catch{chats=[]}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(chats))}catch(e){notice('本地儲存失敗：'+e.message)}}
function notice(t){$('ai-ui-hint').textContent=t}
function sidebar(){$('ai-explorer').classList.toggle('collapsed',!open);$('ai-header-explorer').setAttribute('aria-expanded',String(open))}
function saveBeforeSwitch(){const c=current();if(c){thread.querySelectorAll('.ai-ui-block').forEach(card=>{const ta=card.querySelector('.ai-ui-block-edit');if(!ta)return;const i=Number(card.id.slice('ai-block-'.length));if(c.blocks[i])c.blocks[i].text=ta.value})}persist()}
function enter(){window.BVShowPage?.('editor');body.classList.add('ai-active');$('ai-chat-page').hidden=false;$('ai-explorer').hidden=false;$('ai-header-tools').hidden=false;$('editor-header-tools').hidden=true;$('cloud-header-tools').hidden=true;sidebar();renderTree();renderThread()}
function back(){saveBeforeSwitch();body.classList.remove('ai-active');$('ai-chat-page').hidden=true;$('ai-explorer').hidden=true;$('ai-header-tools').hidden=true;$('editor-header-tools').hidden=false;$('ai-directory-menu').hidden=true;$('ai-api-panel').hidden=true}
$('ai-page-toggle').addEventListener('click',enter);$('ai-header-back').addEventListener('click',back);$('ai-header-explorer').addEventListener('click',()=>{open=!open;sidebar()});$('ai-sider-close').addEventListener('click',()=>{open=false;sidebar()});$('ai-back-note-model').addEventListener('click',back);$('ai-explorer-note').addEventListener('click',back);
const list=$('ai-chat-list'),thread=$('ai-ui-thread');
function current(){return chats.find(c=>c.id===selected)}
function numberFor(chat,index){const role=chat.blocks[index].role;return chat.blocks.slice(0,index+1).filter(b=>b.role===role).length}
function renderTree(){list.replaceChildren();const q=$('ai-chat-search').value.trim().toLowerCase();const found=chats.filter(c=>c.title.toLowerCase().includes(q));if(!found.length){const p=document.createElement('p');p.className='ai-chat-list-empty';p.textContent=chats.length?'找不到聊天':'尚無聊天，請點擊 + New Chat';list.append(p);return}for(const c of found){const details=document.createElement('details');details.className='ai-ui-chat-tree';details.open=expanded.has(c.id)||c.id===selected;const summary=document.createElement('summary');summary.className='tree-node';summary.draggable=true;summary.title='長按或拖曳以調整聊天順序；右鍵可下載或刪除';const title=document.createElement('span');title.className='node-label';title.textContent='▣ '+c.title;const count=document.createElement('small');count.textContent=c.blocks.length;summary.append(title,count);summary.addEventListener('click',()=>{if(selected!==c.id){saveBeforeSwitch();selected=c.id;renderThread()}if(details.open)expanded.delete(c.id);else expanded.add(c.id)});summary.addEventListener('contextmenu',e=>{e.preventDefault();showContext(c.id,e.clientX,e.clientY)});summary.addEventListener('dragstart',e=>{draggedId=c.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',c.id)});summary.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';details.classList.add('ai-drop-target')});summary.addEventListener('dragleave',()=>details.classList.remove('ai-drop-target'));summary.addEventListener('drop',e=>{e.preventDefault();details.classList.remove('ai-drop-target');reorder(draggedId||e.dataTransfer.getData('text/plain'),c.id);draggedId=null});summary.addEventListener('dragend',()=>{draggedId=null;details.classList.remove('ai-drop-target')});let touchTimer=null,touchStart=null;summary.addEventListener('touchstart',e=>{touchStart=[e.touches[0].clientX,e.touches[0].clientY];touchTimer=setTimeout(()=>{touchTimer=null;showContext(c.id,touchStart[0],touchStart[1]);notice('長按選單可移動聊天位置，亦可下載或刪除')},650)},{passive:true});summary.addEventListener('touchmove',e=>{if(touchStart&&Math.hypot(e.touches[0].clientX-touchStart[0],e.touches[0].clientY-touchStart[1])>12)clearTimeout(touchTimer)},{passive:true});summary.addEventListener('touchend',()=>clearTimeout(touchTimer));details.append(summary);for(let j=c.blocks.length-1;j>=0;j--){const b=c.blocks[j],btn=document.createElement('button');btn.type='button';btn.className='tree-node ai-block-node';const name=document.createElement('span');name.className='node-label';name.textContent=`${b.role}${numberFor(c,j)} · ${b.text.replace(/\s+/g,' ').slice(0,28)}`;btn.append(name);btn.addEventListener('click',()=>{if(selected!==c.id)saveBeforeSwitch();selected=c.id;renderThread();document.getElementById('ai-block-'+j)?.scrollIntoView({behavior:'smooth',block:'center'})});btn.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();showContext(c.id,e.clientX,e.clientY,j)});let blockTouchTimer=null,blockTouchPos=null;btn.addEventListener('touchstart',e=>{blockTouchPos=[e.touches[0].clientX,e.touches[0].clientY];blockTouchTimer=setTimeout(()=>{blockTouchTimer=null;showContext(c.id,blockTouchPos[0],blockTouchPos[1],j)},650)},{passive:true});btn.addEventListener('touchmove',e=>{if(blockTouchTimer&&blockTouchPos&&Math.hypot(e.touches[0].clientX-blockTouchPos[0],e.touches[0].clientY-blockTouchPos[1])>12)clearTimeout(blockTouchTimer)},{passive:true});btn.addEventListener('touchend',()=>clearTimeout(blockTouchTimer));details.append(btn)}list.append(details)}}
function reorder(sourceId,targetId){if(!sourceId||sourceId===targetId)return;const from=chats.findIndex(c=>c.id===sourceId),to=chats.findIndex(c=>c.id===targetId);if(from<0||to<0)return;const [chat]=chats.splice(from,1);chats.splice(to,0,chat);persist();renderTree();notice('已儲存聊天排列順序')}
const menu=$('ai-chat-context');function hideContext(){menu.hidden=true;contextId=null;blockContext=null;$('ai-chat-context-download').hidden=false;$('ai-chat-context-up').hidden=false;$('ai-chat-context-down').hidden=false;$('ai-chat-context-delete').textContent='刪除聊天'}function showContext(id,x,y,blockIndex=null){hideContext();contextId=id;blockContext=blockIndex;const isBlock=blockIndex!==null;$('ai-chat-context-download').hidden=isBlock;$('ai-chat-context-up').hidden=isBlock;$('ai-chat-context-down').hidden=isBlock;$('ai-chat-context-delete').textContent=isBlock?'刪除 Q/A Block':'刪除聊天';menu.hidden=false;menu.style.left=Math.max(6,Math.min(x,innerWidth-195))+'px';menu.style.top=Math.max(6,Math.min(y,innerHeight-180))+'px'}
$('ai-chat-context-download').addEventListener('click',()=>{const c=chats.find(c=>c.id===contextId);if(c){saveBeforeSwitch();download(exportMarkdown(c),c.title+'.md')}hideContext()});
$('ai-chat-context-delete').addEventListener('click',()=>{const c=chats.find(c=>c.id===contextId),idx=blockContext;if(c&&idx!==null){deleteBlock(c.id,idx)}else if(c&&confirm('確定永久刪除此瀏覽器中的聊天「'+c.title+'」？建議先下載備份。')){chats=chats.filter(x=>x.id!==c.id);if(selected===c.id)selected=null;persist();renderTree();renderThread();notice('已刪除聊天')}hideContext()});
$('ai-chat-context-up').addEventListener('click',()=>{const i=chats.findIndex(c=>c.id===contextId);if(i>0)reorder(contextId,chats[i-1].id);hideContext()});
$('ai-chat-context-down').addEventListener('click',()=>{const i=chats.findIndex(c=>c.id===contextId);if(i>=0&&i<chats.length-1)reorder(contextId,chats[i+1].id);hideContext()});
document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))hideContext()});document.addEventListener('keydown',e=>{if(e.key==='Escape')hideContext()});
function deleteBlock(chatId,index){const c=chats.find(x=>x.id===chatId);if(!c||index<0||index>=c.blocks.length)return;const b=c.blocks[index];if(!confirm(`確定永久刪除 ${b.role}${numberFor(c,index)} Block？此操作無法復原。`))return;c.blocks.splice(index,1);persist();renderTree();renderThread();notice('已刪除 Q/A Block 並保存至本地')}
function renderMarkdown(container,source){container.innerHTML=safeHTML(parseDocument(source));renderLooseMath(container);renderMathElements(container);window.BVRenderMermaid?.()}
function renderThread(){thread.replaceChildren();const c=current();if(!c){const empty=document.createElement('div');empty.className='ai-ui-empty';empty.textContent='點擊左側 NEW CHAT 開始聊天';thread.append(empty);return}for(let j=0;j<c.blocks.length;j++){const b=c.blocks[j],card=document.createElement('article');card.className='ai-ui-block';card.id='ai-block-'+j;const head=document.createElement('div');head.className='ai-ui-block-head';const label=document.createElement('strong');label.textContent=`${b.role}${numberFor(c,j)} | ${b.role==='Q'?'User':'AI'}`;const actions=document.createElement('div');actions.className='ai-block-actions';const fold=document.createElement('button');fold.type='button';fold.className='ai-ui-fold';fold.textContent='收合';fold.setAttribute('aria-expanded','true');const edit=document.createElement('button');edit.type='button';edit.className='ai-ui-edit';edit.textContent='Edit';const del=document.createElement('button');del.type='button';del.className='ai-ui-delete';del.textContent='Delete';del.title='刪除此 Q/A Block';del.addEventListener('click',()=>deleteBlock(c.id,j));const content=document.createElement('div');content.className='ai-ui-block-text';renderMarkdown(content,b.text);edit.addEventListener('click',()=>{if(edit.textContent==='Edit'){const ta=document.createElement('textarea');ta.className='ai-ui-block-edit';ta.value=b.text;content.replaceChildren(ta);edit.textContent='Commit';edit.classList.add('ai-ui-commit');ta.focus()}else{const ta=content.querySelector('textarea');if(!ta)return;b.text=ta.value;persist();edit.textContent='Edit';edit.classList.remove('ai-ui-commit');renderMarkdown(content,b.text);renderTree();notice('Block 已 Commit 並保存')}});fold.addEventListener('click',()=>{const hidden=content.hidden=!content.hidden;fold.textContent=hidden?'展開':'收合';fold.setAttribute('aria-expanded',String(!hidden));});actions.append(fold,edit,del);head.append(label,actions);card.append(head,content);thread.append(card)}thread.scrollTop=thread.scrollHeight}
function createChat(){saveBeforeSwitch();const c={id:crypto.randomUUID?.()||String(Date.now()),title:'新聊天 '+(chats.length+1),blocks:[]};chats.unshift(c);selected=c.id;expanded.add(c.id);persist();renderTree();renderThread();$('ai-message-input').focus();notice('已建立新聊天')}
$('ai-new-chat').addEventListener('click',createChat);$('ai-chat-search').setAttribute('autocomplete','off');$('ai-chat-search').value='';window.addEventListener('pageshow',()=>{const search=$('ai-chat-search');if(search){search.value='';renderTree();}});$('ai-chat-search').addEventListener('input',renderTree);$('ai-explorer-refresh').addEventListener('click',renderTree);
function exportMarkdown(c){return '# '+c.title+'\n\n'+c.blocks.map((b,i)=>`## ${b.role}${numberFor(c,i)}｜${b.role==='Q'?'User':'AI'}\n\n${b.text}\n\n---`).join('\n\n')+'\n'}
function download(text,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'_');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('ai-header-save').addEventListener('click',()=>{if(!current())return notice('請先建立聊天');saveBeforeSwitch();notice('已保存至此瀏覽器的本地資料（非磁碟檔案）')});$('ai-header-download').addEventListener('click',()=>{const c=current();if(!c)return notice('請先建立聊天');saveBeforeSwitch();download(exportMarkdown(c),c.title+'.md');notice('已下載 Markdown')});
const dir=$('ai-directory-menu'),dirBtn=$('ai-header-directory');function positionMenu(){const r=dirBtn.getBoundingClientRect();dir.style.setProperty('--ai-menu-top',r.bottom+5+'px');dir.style.setProperty('--ai-menu-right',Math.max(8,innerWidth-r.right)+'px')}
dirBtn.addEventListener('click',()=>{positionMenu();dir.hidden=!dir.hidden;dirBtn.setAttribute('aria-expanded',String(!dir.hidden))});
[['ai-directory-toc','目錄化'],['ai-directory-annotation','標註'],['ai-directory-marks','標記列表']].forEach(([id,label])=>$(id).addEventListener('click',()=>{dir.hidden=true;notice(label+'：需將既有 toc.js 的選取目標改接至 AI Block；目前未啟用，避免誤改一般文件')}));
$('ai-header-ai-settings').addEventListener('click',()=>{const p=$('ai-api-panel');p.hidden=!p.hidden;const r=$('ai-header-ai-settings').getBoundingClientRect();p.style.setProperty('--ai-menu-top',r.bottom+6+'px')});$('ai-api-close').addEventListener('click',()=>{$('ai-api-panel').hidden=true});
const attachments=[];
const BYOK_ENDPOINT="https://bv-note-byok.xcxc84584.workers.dev/ai/responses";
const MAX_ATTACHMENTS=10;
const MAX_FILE_BYTES=100*1024*1024;
const CHUNK_BYTES=5*1024*1024;
const MAX_EXTRACTED_BYTES=32*1024*1024;
const MAX_ZIP_ENTRIES=100;
// Large file contents are staged as 5 MiB parts; website AI currently reads only an excerpt.
$('ai-attach-button').addEventListener('click',()=>$('ai-attach-input').click());
$('ai-attach-input').addEventListener('change',async e=>{for(const f of e.target.files){if(f.size>MAX_FILE_BYTES){notice('附件超過 100 MiB：'+f.name);continue}if(attachments.length>=MAX_ATTACHMENTS){notice('每次最多 10 個附件');break}attachments.push(f)}e.target.value='';showAttachments()});
$('ai-message-input').addEventListener('paste',e=>{const images=Array.from(e.clipboardData?.items||[]).filter(x=>x.kind==='file'&&x.type.startsWith('image/'));if(!images.length)return;e.preventDefault();for(const item of images){if(attachments.length>=MAX_ATTACHMENTS){notice('每次最多 10 個附件');break}const f=item.getAsFile();if(!f)continue;if(f.size>MAX_FILE_BYTES){notice('圖片超過 100 MiB');continue}attachments.push(new File([f],'pasted-image-'+Date.now()+'.png',{type:f.type}))}showAttachments()});
async function extractedText(f){const ext=f.name.toLowerCase().split('.').pop();if(['doc','ppt','xls'].includes(ext))throw Error('舊版 Office 格式 '+f.name+' 尚無安全解析器，請轉存為 docx/pptx/xlsx');if(['zip','docx','pptx','xlsx'].includes(ext)){if(!window.JSZip)throw Error('ZIP 解析模組未載入');const zip=await JSZip.loadAsync(f);const entries=Object.values(zip.files).filter(x=>!x.dir);if(entries.length>MAX_ZIP_ENTRIES)throw Error('壓縮檔項目超過 '+MAX_ZIP_ENTRIES);let total=0;const pieces=[];const allowed=/\.(txt|md|json|csv|xml|html|css|js|ts|py|java|c|cpp|h|hpp|yaml|yml|log|sql)$/i;for(const e of entries){if(e.name.includes('..')||e.name.startsWith('/'))continue;let include=ext==='zip'?allowed.test(e.name):ext==='docx'?/^word\/(document|header\d*|footer\d*)\.xml$/.test(e.name):ext==='pptx'?/^ppt\/slides\/slide\d+\.xml$/.test(e.name):/^xl\/(worksheets\/sheet\d+|sharedStrings)\.xml$/.test(e.name);if(!include)continue;const t=await e.async('string');total+=t.length;if(total>MAX_EXTRACTED_BYTES)throw Error('附件解壓文字超過限制');let content=t;if(ext!=='zip'){const doc=new DOMParser().parseFromString(t,'application/xml');content=doc.documentElement.textContent||''}pieces.push('--- '+e.name+' ---\n'+content)}if(!pieces.length)throw Error('無可讀取內容：'+f.name);return pieces.join('\n')}const t=await f.text();if(t.length>MAX_EXTRACTED_BYTES)throw Error('文字附件過大');return t}
function showAttachments(){const el=$('ai-attachment-list');el.replaceChildren();attachments.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.textContent='✕ '+f.name;b.title='移除此附件';b.addEventListener('click',()=>{attachments.splice(i,1);showAttachments()});el.append(b)})}
// Local-only: slices are processed in the browser. Only a small manifest is sent for quota accounting.
async function uploadSiteAttachment(file,token){
 const name=file.name.toLowerCase();
 if(file.type.startsWith('image/')||name.endsWith('.pdf'))throw Error('網站模式尚未支援圖片/PDF 文字解析；請使用個人 API Key 模式');
 const content=await extractedText(file);
 const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
 if(!blob.size)throw Error('附件沒有可讀取的文字：'+file.name);
 const count=Math.ceil(blob.size/CHUNK_BYTES);
 if(count>200)throw Error('附件分片數超過限制');
 const id=crypto.randomUUID();
 for(let i=0;i<count;i++){
  const part=blob.slice(i*CHUNK_BYTES,(i+1)*CHUNK_BYTES);
  // Read locally, calculate a SHA-256 checksum, and transmit ONLY the digest/length metadata.
  const bytes=await part.arrayBuffer();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  notice('本地處理 '+file.name+'：'+(i+1)+'/'+count+'（每片計入 1 次網站額度）');
  const response=await fetch(window.BV_CLOUD_API_URL+'/api/ai/chunk',{method:'POST',headers:{
   'Authorization':'Bearer '+token,'Content-Type':'application/json'
  },body:JSON.stringify({upload_id:id,part_index:i,part_count:count,bytes:bytes.byteLength,sha256:digest})});
  let result;try{result=await response.json()}catch{throw Error('分片登記失敗 HTTP '+response.status)}
  if(!response.ok)throw Error((result.error||'分片登記失敗')+' [ErrorID: '+(result.error_id||response.status)+']');
 }
 // Only this bounded excerpt is transmitted to the AI; the rest stays in the browser.
 return {id,count,name:file.name,excerpt:content.slice(0,3500)};
}
function asDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('讀取附件失敗'));r.readAsDataURL(file)})}
async function send(){const source=$('ai-message-input').value.trim();if((!source&&!attachments.length)||sending)return;
const own=$('ai-api-mode').value==='byok',model=$('ai-model-select').value,key=$('ai-personal-key').value.trim();
if(own&&!key){notice('請輸入個人 API Key');return}
if(!own&&!window.BVAuth?.getToken()){notice('請先登入 BV-Note 帳號');window.BVAuth?.open();return}
const url=BYOK_ENDPOINT;
sending=true;$('ai-send-preview').disabled=true;notice('正在準備附件…');
if(!own&&window.BVUnifiedAI){
 try{
  let c=current();if(!c){createChat();c=current()}
  const hist=c.blocks.map(b=>({role:b.role==='Q'?'user':'assistant',text:b.text}));
  const labels=attachments.map(f=>'[?辣] '+f.name);
  const shown=source+(labels.length?'\n\n'+labels.join('\n'):'');
  c.blocks.push({role:'Q',text:shown});if(c.blocks.length===1)c.title=(source||labels[0]||'?啗?憭?).replace(/[#*`\n]/g,' ').slice(0,38)||c.title;
  persist();renderTree();renderThread();
  let answer='';const result=await window.BVUnifiedAI.send({source,files:[...attachments],history:hist,token:window.BVAuth.getToken(),model,onDelta:d=>{answer+=d;notice('甇??交??嚗?+answer.length+' 摮?')}});
  c.blocks.push({role:'A',text:result.text});$('ai-message-input').value='';attachments.length=0;showAttachments();persist();renderTree();renderThread();notice('AI ??摰?嚗race='+result.trace);window.BVAuth?.refresh();
 }catch(e){notice('AI 隢?憭望?嚗?+e.message+'嚗?靽??航炊隞?Ⅳ??trace 隞乩? /log ?嚗?)}
 finally{sending=false;$('ai-send-preview').disabled=false}
 return;
}
try{const parts=[{type:'input_text',text:source||'請分析附件'}],labels=[],uploads=[];
for(const f of attachments){
 if(!own){uploads.push(await uploadSiteAttachment(f,window.BVAuth.getToken()));labels.push('[本地分片計費] '+f.name);continue}
 if(f.size>20*1024*1024)throw Error('個人 API 模式單檔上限 20 MiB；更大的附件需使用 OpenAI Files API（尚未整合）');
 const data=await asDataURL(f);
 if(f.type.startsWith('image/')){if(!/^(image\/png|image\/jpeg|image\/webp|image\/gif)$/.test(f.type))throw Error('不支援的圖片類型');parts.push({type:'input_image',image_url:data});labels.push('[圖片] '+f.name)}
 else if(f.name.toLowerCase().endsWith('.pdf')){parts.push({type:'input_file',filename:f.name,file_data:data});labels.push('[PDF] '+f.name)}
 else{const content=await extractedText(f);parts.push({type:'input_text',text:'\n--- FILE: '+f.name+' ---\n'+content+'\n--- END FILE ---'});labels.push('[文件] '+f.name)}
}
let c=current();if(!c){createChat();c=current()}
const shown=source+(labels.length?'\n\n'+labels.join('\n'):'');c.blocks.push({role:'Q',text:shown});if(c.blocks.length===1)c.title=(source||labels[0]).replace(/[#*`\n]/g,' ').slice(0,38)||c.title;
persist();renderTree();renderThread();notice('正在向 OpenAI 發送請求…');
const history=c.blocks.slice(0,-1).map(b=>({role:b.role==='Q'?'user':'assistant',content:b.text}));history.push({role:'user',content:parts});
const headers={'Content-Type':'application/json'};let endpoint,body;
if(own){endpoint=url;headers['X-BV-User-Key']=key;body=JSON.stringify({model,input:history,store:false})}
else{endpoint=window.BV_CLOUD_API_URL+'/api/ai/chat';headers.Authorization='Bearer '+window.BVAuth.getToken();body=JSON.stringify({input:history,uploads})}
const res=await fetch(endpoint,{method:'POST',headers,body});const data=await res.json();if(!res.ok){const msg=typeof data.error==='string'?data.error:data.error?.message||'HTTP '+res.status;throw Error(msg+' [ErrorID: '+(data.error_id||'AI-FE-HTTP-'+res.status)+']')}
const output=data.output_text||data.output?.flatMap(o=>o.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n')||'';if(!output)throw Error('API 沒有回傳文字內容');c.blocks.push({role:'A',text:output});$('ai-message-input').value='';attachments.length=0;showAttachments();persist();renderTree();renderThread();notice('已收到 AI 回答'+(own?'（個人 API）':'（網站 API；附件僅傳送前 3,500 字元預覽，其他內容保留本地）'));if(!own)window.BVAuth?.refresh();
}catch(e){notice('AI 請求失敗：'+e.message+'。請檢查附件、模型及 API 設定。')}finally{sending=false;$('ai-send-preview').disabled=false}}
$('ai-send-preview').addEventListener('click',send);$('ai-message-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send()}});
window.addEventListener('beforeunload',()=>{apiKey=''});renderTree();renderThread();})();
// AREA A09 END: AIChatManager
