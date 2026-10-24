/* BV-Note v3.7.6: scope autofill protection to non-auth inputs only. */
(()=>{'use strict';
 const ids=['explorer-search-input','ai-chat-search','cloud-search-input','ai-message-input'];
 function protect(el){
   if(!el||el.dataset.bvAutofillProtected==='1')return;
   el.dataset.bvAutofillProtected='1';
   el.setAttribute('autocomplete','off');
   el.setAttribute('autocapitalize','off');
   el.setAttribute('spellcheck','false');
   // Chrome and some password managers skip readonly fields during page load.
   // Remove it on user focus, preserving normal editing and input events.
   el.readOnly=true;
   el.addEventListener('focus',()=>{el.readOnly=false;},{once:true});
   el.addEventListener('pointerdown',()=>{el.readOnly=false;},{once:true});
   el.addEventListener('keydown',()=>{el.readOnly=false;},{once:true});
 }
 function init(){ids.forEach(id=>protect(document.getElementById(id)));}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
