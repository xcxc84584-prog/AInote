
/* BV-Note v3.9.12.1: AI Explorer context actions, continuation and GPT-5 default. */
const $=id=>document.getElementById(id);
const STORE='bvnote-ai-chats-v358';
const list=$('ai-chat-list'),thread=$('ai-ui-thread'),input=$('ai-message-input');
const aiActive=()=>document.body.classList.contains('ai-active')&&!$('ai-chat-page')?.hidden;
const read=()=>{try{const v=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const write=x=>localStorage.setItem(STORE,JSON.stringify(x));
const visible=()=>[...list.querySelectorAll('.ai-ui-chat-tree')];
const getContext=(node)=>{
 const tree=node?.closest('.ai-ui-chat-tree');if(!tree)return null;
 const title=tree.querySelector('summary .node-label')?.textContent?.replace(/^▣\s*/,'').trim();
 const chats=read(),chat=chats.find(x=>x.title===title);
 if(!chat)return null;
 const nodes=[...tree.querySelectorAll('.ai-block-node')];const reverseIndex=nodes.indexOf(node);
 if(reverseIndex<0)return null;
 const index=chat.blocks.length-1-reverseIndex;
 return {chat,index,block:chat.blocks[index]};
};
const chosen=()=>[...list.querySelectorAll('.ai-block-node')].filter(n=>n.querySelector('.bv3912-check')?.checked).map(getContext).filter(Boolean);
const notice=s=>{const n=$('ai-ui-hint');if(n)n.textContent=s};
function save(name,contents,type='text/markdown;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([contents],{type})),a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'_');a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
const exportBlock=r=>`# ${r.chat.title}\n\n## ${r.block.role}${r.chat.blocks.slice(0,r.index+1).filter(x=>x.role===r.block.role).length}\n\n${r.block.text}\n`;
function selectedOrContext(context){const picked=chosen();if(context&&!picked.some(r=>r.chat.id===context.chat.id&&r.index===context.index))picked.push(context);return picked}
async function downloadBlocks(records){
 if(!records.length)return notice('尚未選取任何區塊');
 if(records.length===1){const r=records[0];save(`QA_${r.chat.title}_${r.index+1}.md`,exportBlock(r));return}
 if(!window.JSZip)return notice('ZIP 元件尚未載入');
 const zip=new JSZip();records.forEach((r,i)=>zip.file(`QA_${String(i+1).padStart(3,'0')}.md`,exportBlock(r)));
 save('BVNote_QA_Blocks.zip',await zip.generateAsync({type:'blob'}),'application/zip');
}
function deleteBlocks(records){
 if(!records.length)return notice('尚未選取任何區塊');
 if(!confirm(`確定永久刪除 ${records.length} 個 Q/A 區塊？建議先下載備份。`))return;
 const chats=read();const unique=new Map();
 for(const r of records)unique.set(r.chat.id+':'+r.index,r);
 for(const r of [...unique.values()].sort((a,b)=>b.index-a.index)){
   const c=chats.find(x=>x.id===r.chat.id);
   if(!c||c.blocks[r.index]?.text!==r.block.text){notice('聊天已更新，請重新選取後再試');return}
 }
 for(const r of [...unique.values()].sort((a,b)=>b.index-a.index)){
   chats.find(x=>x.id===r.chat.id).blocks.splice(r.index,1);
 }
 write(chats);notice('已刪除；正在重新整理');location.reload();
}
// Move bulk operations out of the Explorer surface into the right-click menu.
const bulk=$('bv3912-bulk');if(bulk)bulk.hidden=true;
const menu=document.createElement('div');menu.id='bv39121-context';menu.hidden=true;
const make=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>{menu.hidden=true;Promise.resolve(fn()).catch(e=>notice('操作失敗：'+e.message))};menu.append(b);return b};
let target=null;
make('下載此 Q/A Block (.md)',()=>downloadBlocks(target?[target]:[]));
make('下載已選區塊 (.zip)',()=>downloadBlocks(chosen()));
make('刪除此 Q/A Block',()=>deleteBlocks(target?[target]:[]));
make('刪除已選區塊',()=>deleteBlocks(chosen()));
make('全選目前對話區塊',()=>{const tree=target?.node?.closest('.ai-ui-chat-tree');if(!tree)return;tree.querySelectorAll('.bv3912-check').forEach(c=>c.checked=true);notice('已選取目前對話區塊')});
make('取消所有選取',()=>{list.querySelectorAll('.bv3912-check').forEach(c=>c.checked=false);notice('已取消選取')});
document.body.append(menu);
window.addEventListener('contextmenu',e=>{
 const node=e.target.closest('.ai-block-node');if(!node)return;
 const record=getContext(node);if(!record)return;
 e.preventDefault();e.stopImmediatePropagation();
 target={...record,node};menu.hidden=false;
 menu.style.left=Math.max(6,Math.min(e.clientX,innerWidth-230))+'px';
 menu.style.top=Math.max(6,Math.min(e.clientY,innerHeight-250))+'px';
},true);
document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true});
// The v3.9.12 continuation button only prefilled a new Q. Replace it.
document.querySelectorAll('#ai-chat-composer > button').forEach(b=>{if(b.textContent.includes('繼續未完成'))b.remove()});
const continueBtn=document.createElement('button');continueBtn.type='button';continueBtn.id='bv39121-continue';continueBtn.textContent='↻ 繼續生成未完成的回答';
const composer=$('ai-chat-composer'),row=composer?.querySelector('.ai-ui-compose-row');
if(row)row.before(continueBtn);else composer?.prepend(continueBtn);
let continuing=false;
continueBtn.onclick=async()=>{
 if(continuing)return;
 const chats=read(),activeTitle=[...visible()].find(d=>d.open)?.querySelector('summary .node-label')?.textContent?.replace(/^▣\s*/,'').trim();
 const chat=chats.find(c=>c.title===activeTitle);
 if(!chat||!chat.blocks.length)return notice('請先選擇包含 AI 回答的對話');
 const idx=chat.blocks.length-1;
 const qOnly=chat.blocks[idx].role==='Q';
 if(!qOnly&&chat.blocks[idx].role!=='A')return notice('最後一個區塊不是 Q 或 A，無法接續');
 if(!window.BVUnifiedAI?.send)return notice('網站串流 AI 尚未準備完成');
 if(!window.BVAuth?.getToken())return notice('請先登入');
 const model=$('ai-model-select');if(model)model.value='gpt-5';
 continuing=true;continueBtn.disabled=true;continueBtn.textContent='正在接續回答…';
 let received='';
 try{
  const hist=chat.blocks.map(b=>({role:b.role==='Q'?'user':'assistant',text:b.text}));
  const result=await window.BVUnifiedAI.send({
   source:'請直接從上一段回答中斷處接續，不要重複已完成的內容；只輸出後續部分，直到完成。',
   files:[],history:hist,token:window.BVAuth.getToken(),model:'gpt-5',
   onDelta:delta=>{received+=delta}
  });
  const current=read(),c=current.find(x=>x.id===chat.id);
  if(!c||c.blocks[idx]?.role!==(qOnly?'Q':'A'))throw Error('原回答已變更，停止合併');
  if(qOnly)c.blocks.push({role:'A',text:'',stream_state:'generating'});
  const aIndex=qOnly?idx+1:idx;
  const addition=result.text||received;
  if(!addition.trim())throw Error('未收到新的回答');
  c.blocks[aIndex].text+=addition.startsWith('\n')?'':'\n\n';
  c.blocks[aIndex].text+=addition;c.blocks[aIndex].stream_state='completed';
  write(current);notice('接續完成，已合併到原 A Block；重新整理以同步顯示');
  location.reload();
 }catch(e){
  // Preserve any streamed text locally even if the connection is interrupted.
  if(received.trim()){
   const current=read(),c=current.find(x=>x.id===chat.id);
   if(c&&c.blocks[idx]?.role===(qOnly?'Q':'A')){
    if(qOnly)c.blocks.push({role:'A',text:'',stream_state:'interrupted'});
    c.blocks[qOnly?idx+1:idx].text+='\n\n'+received;write(current);
    notice('串流中斷，已保留收到的部分；重新整理後可繼續接續');location.reload();return;
   }
  }
  notice('接續失敗：'+String(e.message||e));
 }finally{continuing=false;continueBtn.disabled=false;continueBtn.textContent='↻ 繼續生成未完成的回答'}
};
// Default to GPT-5 on the AI page. Site backend v2 accepts gpt-5 but account entitlement is checked upstream.
const model=$('ai-model-select');
if(model){model.value='gpt-5';model.dispatchEvent(new Event('change',{bubbles:true}));}
const observer=new MutationObserver(()=>{if(bulk&&!bulk.hidden)bulk.hidden=true;});
if(bulk)observer.observe(bulk,{attributes:true,attributeFilter:['hidden']});
