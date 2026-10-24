/* BV-Note v3.9.12.7: consolidate Q/A actions into a compact top-right menu. */
(()=>{'use strict';
const thread=document.getElementById('ai-ui-thread');
if(!thread)return;
function enhance(card){
 const actions=card.querySelector('.ai-block-actions');if(!actions)return;
 const menu=actions.querySelector('.bv39125-menu');
 const edit=actions.querySelector('.ai-ui-edit'),fold=actions.querySelector('.ai-ui-fold');
 if(!menu||!edit||!fold)return;
 const choices=menu.querySelector('.bv39125-menu-items');if(!choices)return;
 card.classList.add('bv39127-card');actions.classList.add('bv39127-actions');
 // Keep existing application event handlers; forward menu actions to existing buttons.
 if(!choices.querySelector('[data-bv39127="edit"]')){
  const btn=document.createElement('button');btn.type='button';btn.dataset.bv39127='edit';
  btn.textContent='Edit';btn.addEventListener('click',()=>{menu.open=false;edit.click()});
  choices.insertBefore(btn,choices.firstChild);
 }
 // Re-enable the pre-existing full-editor command, hidden by the v3.9.12.6 UI-only patch.
 for(const btn of choices.querySelectorAll('button')){
  if(btn.textContent.trim()==='展開編輯'){btn.hidden=false;btn.classList.add('bv39127-full-edit')}
 }
 if(!choices.querySelector('[data-bv39127="attachment"]')){
  const btn=document.createElement('button');btn.type='button';btn.dataset.bv39127='attachment';btn.textContent='附件';
  btn.addEventListener('click',()=>{
   menu.open=false;
   // Prefer the application's existing attachment button rather than creating a new storage path.
   const trigger=[...card.querySelectorAll('button')].find(b=>b!==btn&&!b.closest('.bv39125-menu-items')&&/^(?:📎\s*)?區塊附件(?:\s*\(\d+\))?$/.test(b.textContent.trim()));
   if(trigger){card.classList.add('bv39127-attachments-open');trigger.click();return}
   const input=card.querySelector('input[type="file"]');
   if(input){input.click();return}
   const panel=card.querySelector('.ai-ui-block-attachments,.ai-ui-attachments');
   if(panel){card.classList.toggle('bv39127-attachments-open');return}
   const hint=document.getElementById('ai-ui-hint');if(hint)hint.textContent='此區塊沒有可用的附件操作';
  });
  const danger=choices.querySelector('.danger');choices.insertBefore(btn,danger||null);
 }
 const sync=()=>{const b=choices.querySelector('[data-bv39127="edit"]');if(b)b.textContent=/commit/i.test(edit.textContent.trim())?'Commit':'Edit'};
 sync();
 if(!menu.dataset.bv39127Sync){menu.addEventListener('toggle',()=>{if(menu.open)sync()});menu.dataset.bv39127Sync='1'}
}
function update(){for(const card of thread.querySelectorAll('.ai-ui-block'))enhance(card)}
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})});
observer.observe(thread,{childList:true,subtree:true});
update();
})();
