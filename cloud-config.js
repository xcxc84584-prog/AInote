/* AREA A-B86E051F START: cloud-config.js */
// AREA A04 START: CloudConfiguration | File: cloud-config.js
window.BV_CLOUD_API_URL = "https://bv-note-cloud.xcxc84584.workers.dev";
// AREA A04 END: CloudConfiguration

// Set this to your Google OAuth Web Client ID (public identifier, NOT a secret).
window.BV_GOOGLE_CLIENT_ID = "833271161479-moq1iaf71tpdhe6m95tkk0ibip2fktf4.apps.googleusercontent.com";

// v3.8.9.4: non-authorizing guest ID for request telemetry; same-origin API only.
(()=>{/* BLOCK B-05240EDBE1 START: AREA A-B86E051F */const k='bvnote-guest-telemetry-id-v3894';let id;try{id=localStorage.getItem(k);if(!id){id=crypto.randomUUID();localStorage.setItem(k,id)}}catch{return}const orig=window.fetch.bind(window);window.fetch=function(input,init){/* BLOCK B-DDA96DEE61 START: AREA A-B86E051F */try{const url=new URL(typeof input==='string'?input:input.url,location.href);const api=String(window.BV_CLOUD_API_URL||'').replace(/\/+$/,'');if(api&&url.origin===new URL(api).origin&&url.pathname.startsWith('/api/')){const h=new Headers(init?.headers||(input instanceof Request?input.headers:undefined));h.set('X-BV-Guest-ID',id);return orig(input,{...init,headers:h})}}catch{}return orig(input,init)/* BLOCK B-DDA96DEE61 END. */}/* BLOCK B-05240EDBE1 END. */})();

/* AREA A-B86E051F END. */
