/* AREA A-399333BE START: ai-composer-toggle-v375.js */
/* BV-Note v3.7.5: AI composer independent collapse control */
(()=>{/* BLOCK B-4FFB13172D START: AREA A-399333BE */'use strict';
const composer=document.getElementById('ai-chat-composer');
const toggle=document.getElementById('ai-composer-toggle');
if(!composer||!toggle)return;
const key='bvnote-ai-composer-collapsed-v375';
let collapsed=false;
try{collapsed=localStorage.getItem(key)==='1'}catch(_e){}
function apply(){/* BLOCK B-81369F112A START: AREA A-399333BE */
 composer.classList.toggle('is-collapsed',collapsed);
 toggle.setAttribute('aria-expanded',String(!collapsed));
 toggle.textContent=collapsed?'▴ 展開輸入框':'▾ 收合輸入框';
 toggle.title=collapsed?'展開 AI 聊天輸入區':'收合 AI 聊天輸入區';
/* BLOCK B-81369F112A END. */}
toggle.addEventListener('click',()=>{/* BLOCK B-76C92F125D START: AREA A-399333BE */
 collapsed=!collapsed;apply();
 try{localStorage.setItem(key,collapsed?'1':'0')}catch(_e){}
 if(!collapsed)document.getElementById('ai-message-input')?.focus();
/* BLOCK B-76C92F125D END. */});
apply();
/* BLOCK B-4FFB13172D END. */})();

/* AREA A-399333BE END. */
