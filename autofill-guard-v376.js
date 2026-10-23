/* AREA A-DDD7CA3C START: autofill-guard-v376.js */
/* BV-Note v3.7.6: scope autofill protection to non-auth inputs only. */
(()=>{/* BLOCK B-C0BDFDF50B START: AREA A-DDD7CA3C */'use strict';
 const ids=['explorer-search-input','ai-chat-search','cloud-search-input','ai-message-input'];
 function protect(el){/* BLOCK B-6A294A7CB9 START: AREA A-DDD7CA3C */
   if(!el||el.dataset.bvAutofillProtected==='1')return;
   el.dataset.bvAutofillProtected='1';
   el.setAttribute('autocomplete','off');
   el.setAttribute('autocapitalize','off');
   el.setAttribute('spellcheck','false');
   // Chrome and some password managers skip readonly fields during page load.
   // Remove it on user focus, preserving normal editing and input events.
   el.readOnly=true;
   el.addEventListener('focus',()=>{/* BLOCK B-84F29D379A START: AREA A-DDD7CA3C */el.readOnly=false;/* BLOCK B-84F29D379A END. */},{once:true});
   el.addEventListener('pointerdown',()=>{/* BLOCK B-EC4F0BA2D2 START: AREA A-DDD7CA3C */el.readOnly=false;/* BLOCK B-EC4F0BA2D2 END. */},{once:true});
   el.addEventListener('keydown',()=>{/* BLOCK B-CB8E7BEA52 START: AREA A-DDD7CA3C */el.readOnly=false;/* BLOCK B-CB8E7BEA52 END. */},{once:true});
 /* BLOCK B-6A294A7CB9 END. */}
 function init(){/* BLOCK B-E0155562AB START: AREA A-DDD7CA3C */ids.forEach(id=>protect(document.getElementById(id)));/* BLOCK B-E0155562AB END. */}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
/* BLOCK B-C0BDFDF50B END. */})();

/* AREA A-DDD7CA3C END. */
