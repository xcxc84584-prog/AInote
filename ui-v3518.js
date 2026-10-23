/* AREA A-DE1077ED START: ui-v3518.js */
/* v3.5.18.1: retain dedicated Cloud create action and original Cloud menu handlers. */
(()=>{/* BLOCK B-5ED7BFF7C4 START: AREA A-DE1077ED */'use strict';const $=id=>document.getElementById(id);const explorer=$('global-explorer-toggle');if(explorer){explorer.setAttribute('aria-controls','explorer ai-explorer');explorer.addEventListener('click',()=>requestAnimationFrame(()=>{/* BLOCK B-AF0451525E START: AREA A-DE1077ED */const ai=$('ai-explorer'),note=$('explorer'),active=ai&&!ai.hidden?ai:note;explorer.setAttribute('aria-expanded',String(!!active&&getComputedStyle(active).display!=='none'&&!active.classList.contains('collapsed')))/* BLOCK B-AF0451525E END. */}));}const brand=document.querySelector('header>strong');if(brand)brand.textContent='BV-NOTE v3.8.8';/* BLOCK B-5ED7BFF7C4 END. */})();

/* AREA A-DE1077ED END. */
