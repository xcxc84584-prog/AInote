(()=>{'use strict';const $=id=>document.getElementById(id);const API='https://bv-note-cloud.xcxc84584.workers.dev';const KEY='bvnote-auth-session-v1';let token=localStorage.getItem(KEY)||'',email='',mode='login';
async function request(path,method='GET',data){const res=await fetch(API+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined});const body=await res.json().catch(()=>({error:'API 回傳格式錯誤'}));if(!res.ok)throw Error(body.error||'HTTP '+res.status);return body;}
function update(){ $('bv-auth-open').textContent=email?'帳號：'+email:'建立新帳號 / 登入';$('bv-auth-logout').hidden=!email;$('bv-auth-status').textContent=email?'已登入：'+email:'未登入';}
async function refresh(){if(!token){email='';update();return null}try{const me=await request('/api/auth/me');email=me.email;update();const hint=$('ai-ui-hint');if(hint)hint.textContent='帳號：'+email+'｜今日 AI 剩餘 '+me.remaining+'/100';return me}catch{token='';email='';localStorage.removeItem(KEY);update();return null}}
function show(){mode='login';switchMode();$('bv-auth-message').textContent='';$('bv-auth-dialog').showModal()}
let signupMethod='email';
function switchMode(){
 const register=mode==='register',migrate=mode==='migrate',emailSignup=register&&signupMethod==='email';
 $('bv-signup-method-label').hidden=!register;
 $('bv-signup-code-label').hidden=!(register&&signupMethod==='code');
 $('bv-signup-email-fields').hidden=!emailSignup;
 $('bv-migrate-fields').hidden=!migrate;
 $('bv-auth-password').required=!migrate;
 $('bv-auth-submit').textContent=register?(emailSignup?'寄送驗證碼 / 完成註冊':'使用邀請碼註冊'):migrate?'寄送驗證碼 / 完成遷移':'登入';
 $('bv-auth-switch').textContent=register||migrate?'返回登入':'建立新帳號';
 $('bv-auth-migrate').hidden=migrate;
}
$('bv-signup-method').addEventListener('change',()=>{signupMethod=$('bv-signup-method').value;$('bv-signup-challenge').value='';$('bv-signup-email-code').value='';switchMode()});
$('bv-auth-open').addEventListener('click',show);
$('bv-auth-close').addEventListener('click',()=>$('bv-auth-dialog').close());
$('bv-auth-migrate').addEventListener('click',()=>{mode='migrate';switchMode();$('bv-auth-message').textContent='舊帳號：驗證原 Gmail 後設定新密碼。';});
$('bv-auth-switch').addEventListener('click',()=>{mode=mode==='login'?'register':'login';switchMode()});
$('bv-auth-email').addEventListener('input',()=>{ $('bv-signup-challenge').value='';$('bv-signup-email-code').value='';$('bv-migrate-challenge').value='';$('bv-migrate-code').value=''; });
$('bv-auth-form').addEventListener('submit',async e=>{
 e.preventDefault();const msg=$('bv-auth-message');msg.textContent='處理中…';
 const b={email:$('bv-auth-email').value,password:$('bv-auth-password').value};
 try{
  if(mode==='migrate'){
   const challenge=$('bv-migrate-challenge').value,code=$('bv-migrate-code').value.trim();
   if(!challenge){const r=await request('/api/auth/migrate/start','POST',{email:b.email});$('bv-migrate-challenge').value=r.challenge_id||'';msg.textContent=r.message||'請查收信箱';return;}
   if(!code){msg.textContent='請先輸入郵件驗證碼';return;}
   if(!b.password||b.password.length<12){msg.textContent='請輸入至少 12 字元的新密碼';return;}
   const r=await request('/api/auth/migrate/complete','POST',{...b,challenge_id:challenge,code});mode='login';switchMode();$('bv-migrate-challenge').value='';$('bv-migrate-code').value='';msg.textContent=r.message||'遷移完成';return;
  }
  if(mode==='register'){
   if(signupMethod==='code'){b.signup_code=$('bv-signup-code').value;await request('/api/auth/register','POST',b);}
   else{
    const challenge=$('bv-signup-challenge').value,code=$('bv-signup-email-code').value.trim();
    if(!challenge){const r=await request('/api/auth/register/email/start','POST',{email:b.email});$('bv-signup-challenge').value=r.challenge_id||'';msg.textContent=r.message||'請查收 Gmail';return;}
    if(!code){msg.textContent='請輸入 Gmail 收到的 12 位驗證碼';return;}
    await request('/api/auth/register/email/complete','POST',{...b,challenge_id:challenge,code});
   }
   mode='login';switchMode();$('bv-signup-challenge').value='';$('bv-signup-email-code').value='';msg.textContent='帳號建立成功，請登入';return;
  }
  const result=await request('/api/auth/login','POST',b);token=result.token;localStorage.setItem(KEY,token);$('bv-auth-password').value='';$('bv-auth-dialog').close();await refresh();
 }catch(err){msg.textContent=err.message}
});
$('bv-auth-logout').addEventListener('click',async()=>{try{await request('/api/auth/logout','POST')}catch{}token='';email='';localStorage.removeItem(KEY);update();$('ai-ui-hint').textContent='已登出。請登入後使用 AI Chat。'});
window.BVAuth={getToken:()=>token,refresh,open:show,request};update();refresh();
})();
