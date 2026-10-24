/* BV-Note v3.9.12.6: small UI-only cleanup. Keep attachment data intact. */
(()=>{'use strict';
const thread=document.getElementById('ai-ui-thread');
const blockSelector='.ai-ui-block';
function update(){
 if(thread){
  for(const card of thread.querySelectorAll(blockSelector)){
   const actions=card.querySelector('.ai-block-actions');
   if(actions){
    for(const item of actions.querySelectorAll('.bv39125-menu-items > button')){
     if(item.textContent.trim()==='展開編輯')item.hidden=true;
    }
    // Hide only the Q/A block attachment controls; never remove stored files.
    for(const b of actions.querySelectorAll('button')){
     if(/^(?:📎\s*)?(?:區塊附件|區塊附件\s*\(\d+\))$/.test(b.textContent.trim()))b.hidden=true;
    }
   }
   for(const b of card.querySelectorAll('button')){
    if(b.closest('.ai-block-actions'))continue;
    if(/^(?:📎\s*)?區塊附件(?:\s*\(\d+\))?$/.test(b.textContent.trim()))b.hidden=true;
   }
   // Some versions render the attachment bar as a div rather than a button.
   for(const el of card.querySelectorAll('.ai-ui-block-attachments,.ai-ui-attachments')){
    el.hidden=true;
   }
  }
 }
 // Input composer button only. Do not rename Q/A fold buttons.
 const composer=document.getElementById('ai-chat-composer');
 if(composer){for(const b of composer.querySelectorAll('button')){
  const label=b.textContent.trim();
  if(label==='展開輸入框'||label==='▴ 展開輸入框'||label==='▾ 展開輸入框')b.textContent='展開';
  else if(label==='收合輸入框'||label==='▴ 收合輸入框'||label==='▾ 收合輸入框')b.textContent='收合';
 }}
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;update()})}
const obs=new MutationObserver(schedule);
for(const el of [thread,document.getElementById('ai-chat-composer')])if(el)obs.observe(el,{childList:true,subtree:true,characterData:true});
update();
})();
