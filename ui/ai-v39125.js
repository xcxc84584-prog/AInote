/* BV-Note v3.9.12.5: compact AI blocks and stable page navigation. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='bvnote-v39125-page';
let intentional=false,restoring=false;
function aiVisible(){return document.body.classList.contains('ai-active')&&!$('ai-chat-page')?.hidden;}
function mark(page){try{sessionStorage.setItem(KEY,page)}catch{}}
function restore(){if(restoring||intentional||aiVisible())return;restoring=true;try{
 const nav=document.querySelector('#global-page-nav [data-page="ai"]');
 if(nav)nav.click();else $('ai-page-toggle')?.click();
 // Older page routers sometimes switch the workspace to NOTE while keeping AI visible.
 if(!aiVisible())$('ai-page-toggle')?.click();
}finally{restoring=false}}
// Explicit page navigation takes precedence over stored state.
document.addEventListener('click',e=>{
 const page=e.target.closest('#global-page-nav [data-page]');
 if(page){intentional=true;mark(page.dataset.page);queueMicrotask(()=>intentional=false);return}
 if(e.target.closest('#ai-page-toggle')){mark('ai');return}
 if(e.target.closest('#ai-header-back,#ai-back-note-model,#ai-explorer-note')){intentional=true;mark('note');queueMicrotask(()=>intentional=false);return}
 if(e.target.closest('#cloud-page-toggle')){intentional=true;mark('cloud');queueMicrotask(()=>intentional=false);return}
 if(e.target.closest('#ai-retry-button,#bv39121-continue,#ai-reload-response'))mark('ai');
},true);
if(sessionStorage.getItem(KEY)==='ai'){
 window.addEventListener('load',()=>{setTimeout(restore,0);setTimeout(()=>{if(!aiVisible())restore()},350)}, {once:true});
}
// Avoid overriding the application's page router. Only repair unexpected navigation
// during an active AI session; a deliberate NOTE/CLOUD click disables this.
const pageObserver=new MutationObserver(()=>{
 if(intentional||restoring)return;
 if(sessionStorage.getItem(KEY)==='ai'&&!aiVisible()){
  // Do not restore during an explicit non-AI page transition.
  setTimeout(()=>{if(!intentional&&sessionStorage.getItem(KEY)==='ai'&&!aiVisible())restore()},80);
 }
});
if($('ai-chat-page'))pageObserver.observe($('ai-chat-page'),{attributes:true,attributeFilter:['hidden']});

function compactBlock(card){
 const actions=card.querySelector('.ai-block-actions');if(!actions)return;
 const edit=actions.querySelector('.ai-ui-edit');
 const fold=actions.querySelector('.ai-ui-fold');
 const del=actions.querySelector('.ai-ui-delete');
 if(!edit||!fold||!del)return;
 let menu=actions.querySelector('.bv39125-menu');
 if(!menu){
  menu=document.createElement('details');menu.className='bv39125-menu';
  const summary=document.createElement('summary');summary.textContent='操作';summary.setAttribute('aria-label','Q/A 區塊操作');
  const choices=document.createElement('div');choices.className='bv39125-menu-items';
  const mk=(label,cb)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{menu.open=false;cb()});choices.append(b);return b};
  mk('展開編輯',()=>{if(edit.textContent.trim().toLowerCase()==='edit')edit.click();
    const content=card.querySelector('.ai-ui-block-text');if(content?.hidden)fold.click();
    card.classList.add('bv39125-expanded');
    const ta=card.querySelector('.ai-ui-block-edit');if(ta){ta.style.minHeight='min(72vh,900px)';ta.focus()}
  });
  mk('收合／展開',()=>fold.click());
  mk('刪除區塊',()=>del.click()).classList.add('danger');
  menu.append(summary,choices);actions.append(menu);
 }
 // Original buttons remain mounted, so their event handlers and data logic are preserved.
 edit.classList.add('bv39125-primary');fold.classList.add('bv39125-original');del.classList.add('bv39125-original');
 actions.classList.add('bv39125-actions');
 edit.setAttribute('aria-label','Edit 或 Commit 區塊');
}
function decorate(){if(!aiVisible())return;document.querySelectorAll('#ai-ui-thread .ai-ui-block').forEach(compactBlock)}
const thread=$('ai-ui-thread');
if(thread){const observer=new MutationObserver(decorate);observer.observe(thread,{childList:true,subtree:false});decorate()}
// Existing settings panel: preserve its business logic; only add accessible labels.
const settings=$('bv-ai-settings-panel')||$('bv39124-settings-panel')||document.querySelector('[id*="ai-settings-panel"]');
if(settings)settings.setAttribute('aria-label','AI 回應設定');
// Close menus on outside click or Escape.
document.addEventListener('pointerdown',e=>{document.querySelectorAll('.bv39125-menu[open]').forEach(m=>{if(!m.contains(e.target))m.open=false})});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.bv39125-menu[open]').forEach(m=>m.open=false)});
})();
