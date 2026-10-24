// GitHub Pages remains public static hosting. This UI blocks app interaction, not static asset delivery.
(async()=>{
 const endpoint=(window.BV_CLOUD_API_URL||window.BV_CLOUD_API||'https://bv-note-cloud.xcxc84584.workers.dev').replace(/\/$/,'');
 let res;try{res=await fetch(endpoint+'/api/health',{cache:'no-store'})}catch{return}
 if(res.status!==403)return;
 let result;try{result=await res.json()}catch{return}
 if(result.code!=='BAN-403')return;
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#0b1119;color:white;z-index:2147483647;display:flex;align-items:center;justify-content:center;font:16px system-ui';
 const box=document.createElement('form');box.style.cssText='max-width:420px;padding:30px;background:#1c2838;border-radius:12px';
 const h=document.createElement('h2');h.textContent='BV-Note access restricted';
 const p=document.createElement('p');p.textContent='Administrator key required to request unban. Maximum five failed attempts; then a five-minute lock.';
 const input=document.createElement('input');input.type='password';input.autocomplete='off';input.placeholder='Administrator key';input.required=true;input.style.cssText='padding:10px;width:100%';
 const button=document.createElement('button');button.textContent='Request unban';button.type='submit';const status=document.createElement('p');
 box.append(h,p,input,button,status);overlay.append(box);document.body.append(overlay);
 box.onsubmit=async e=>{e.preventDefault();button.disabled=true;try{const r=await fetch(endpoint+'/api/access/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminKey:input.value})});input.value='';const data=await r.json();status.textContent=data.error||data.lines?.join(' ')||'Unknown response';if(data.ok)location.reload()}catch(err){status.textContent='Network error'}finally{button.disabled=false}};
})();
