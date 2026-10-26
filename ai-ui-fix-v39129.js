/* BV-Note v3.9.12.9 - final QA card controls. Non-destructive DOM adapter. */
(()=>{'use strict';
const thread=document.getElementById('ai-ui-thread');if(!thread)return;
const label=b=>(b?.textContent||'').trim();
function fix(card){
 const actions=card.querySelector('.ai-block-actions');if(!actions)return;
 const originalEdit=actions.querySelector('.ai-ui-edit');
 const originalFold=actions.querySelector('.ai-ui-fold');
 const originalDelete=actions.querySelector('.ai-ui-delete');
 if(!originalEdit||!originalFold||!originalDelete)return;
 card.classList.add('bv39129-card');actions.classList.add('bv39129-actions');
 // All older menus and inline full-editor buttons are hidden by scoped CSS,
 // but their event handlers remain intact for backwards compatibility.
 if(!actions.querySelector(':scope > .bv39129-edit')){
  const toggle=document.createElement('button');toggle.type='button';toggle.className='bv39129-edit';
  toggle.addEventListener('click',()=>{originalEdit.click();sync(card)});
  actions.append(toggle);
 }
 if(!actions.querySelector(':scope > .bv39129-menu')){
  const menu=document.createElement('details');menu.className='bv39129-menu';
  const summary=document.createElement('summary');summary.textContent='操作';menu.append(summary);
  const items=document.createElement('div');items.className='bv39129-items';
  function item(title,fn,danger=false){const b=document.createElement('button');b.type='button';b.textContent=title;if(danger)b.className='danger';b.addEventListener('click',()=>{menu.open=false;fn()});items.append(b)}
  item('展開編輯',()=>{if(!/commit/i.test(label(originalEdit)))originalEdit.click();const content=card.querySelector('.ai-ui-block-text');if(content?.hidden)originalFold.click();const ta=card.querySelector('.ai-ui-block-edit');if(ta){ta.style.minHeight='min(72vh,900px)';ta.focus()}sync(card)});
  item('收合／展開',()=>originalFold.click());
  item('附件',()=>{
   const attachment=[...card.querySelectorAll('button')].find(b=>!b.closest('.bv39129-menu')&&/^(?:📎\s*)?(?:區塊附件|附件)(?:\s*[（(]\d+[）)])?$/.test(label(b)));
   if(attachment){attachment.click();return}
   const input=card.querySelector('input[type=file]');if(input){input.click();return}
   const panel=card.querySelector('.ai-ui-block-attachments,.ai-ui-attachments');
   if(panel){panel.classList.toggle('bv39129-show-attachments');return}
   const hint=document.getElementById('ai-ui-hint');if(hint)hint.textContent='此區塊沒有可用的附件操作';
  });
  item('刪除區塊',()=>originalDelete.click(),true);
  menu.append(items);actions.append(menu);
 }
 sync(card);
}
function sync(card){const actions=card.querySelector('.ai-block-actions');if(!actions)return;const original=actions.querySelector('.ai-ui-edit'),button=actions.querySelector('.bv39129-edit');if(!original||!button)return;const committing=/commit/i.test(label(original));const value=committing?'Commit':'Edit';if(button.textContent!==value)button.textContent=value;button.classList.toggle('is-commit',committing);button.setAttribute('aria-label',value+' QA Block')}
function update(){for(const card of thread.querySelectorAll('.ai-ui-block'))fix(card)}
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})});observer.observe(thread,{childList:true,subtree:true,characterData:true});update();
document.addEventListener('pointerdown',e=>{for(const menu of thread.querySelectorAll('.bv39129-menu[open]'))if(!menu.contains(e.target))menu.open=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const menu of thread.querySelectorAll('.bv39129-menu[open]'))menu.open=false});
})();
