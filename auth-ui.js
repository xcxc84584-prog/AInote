/* AREA A-455629A1 START: auth-ui.js */
(()=>{/* BLOCK B-13C2926818 START: AREA A-455629A1 */'use strict';const $=id=>document.getElementById(id);const API='https://bv-note-cloud.xcxc84584.workers.dev';const KEY='bvnote-auth-session-v1';let token=localStorage.getItem(KEY)||'',email='',mode='login';
async function request(path,method='GET',data){/* BLOCK B-6EC115E4DA START: AREA A-455629A1 */const res=await fetch(API+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined});const body=await res.json().catch(()=>({error:'API 回傳格式錯誤'}));if(!res.ok)throw Error(body.error||'HTTP '+res.status);return body;/* BLOCK B-6EC115E4DA END. */}
function update(){/* BLOCK B-BDDEFE320D START: AREA A-455629A1 */ $('bv-auth-open').textContent=email?'帳號：'+email:'建立新帳號 / 登入';$('bv-auth-logout').hidden=!email;$('bv-auth-status').textContent=email?'已登入：'+email:'未登入';/* BLOCK B-BDDEFE320D END. */}
async function refresh(){/* BLOCK B-F590136D58 START: AREA A-455629A1 */if(!token){email='';update();return null}try{const me=await request('/api/auth/me');email=me.email;update();const hint=$('ai-ui-hint');if(hint)hint.textContent='帳號：'+email+'｜今日 AI 剩餘 '+me.remaining+'/100';return me}catch{token='';email='';localStorage.removeItem(KEY);update();return null}/* BLOCK B-F590136D58 END. */}
function show(){/* BLOCK B-CB7A88356E START: AREA A-455629A1 */mode='login';switchMode();$('bv-auth-message').textContent='';setPasswordPanel(false);$('bv-auth-dialog').showModal();renderGoogleButton()/* BLOCK B-CB7A88356E END. */}
let signupMethod='email';
function setPasswordPanel(open){/* BLOCK B-E2E85C838C START: AREA A-455629A1 */const panel=$('bv-password-panel'),toggle=$('bv-auth-password-toggle');panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'收起 Gmail／密碼登入':'使用 Gmail／密碼登入或註冊';for(const id of ['bv-auth-email','bv-auth-password'])$(id).required=open && mode!=='migrate';/* BLOCK B-E2E85C838C END. */}
$('bv-auth-password-toggle').addEventListener('click',()=>setPasswordPanel($('bv-password-panel').hidden));
function switchMode(){/* BLOCK B-A86CE0DA32 START: AREA A-455629A1 */
 const register=mode==='register',migrate=mode==='migrate',emailSignup=register&&signupMethod==='email';
 $('bv-signup-method-label').hidden=!register;
 $('bv-signup-code-label').hidden=!(register&&signupMethod==='code');
 $('bv-signup-email-fields').hidden=!emailSignup;
 $('bv-migrate-fields').hidden=!migrate;
 $('bv-auth-password').required=!migrate && !$('bv-password-panel').hidden;
 $('bv-auth-email').required=!$('bv-password-panel').hidden;
 $('bv-auth-submit').textContent=register?(emailSignup?'寄送驗證碼 / 完成註冊':'使用邀請碼註冊'):migrate?'寄送驗證碼 / 完成遷移':'登入';
 $('bv-auth-switch').textContent=register||migrate?'返回登入':'建立新帳號';
 $('bv-auth-migrate').hidden=migrate;
 $('bv-google-signin').hidden=!(mode==='login'||mode==='register'||mode==='migrate');
/* BLOCK B-A86CE0DA32 END. */}
$('bv-signup-method').addEventListener('change',()=>{/* BLOCK B-ABB346B3BF START: AREA A-455629A1 */signupMethod=$('bv-signup-method').value;$('bv-signup-challenge').value='';$('bv-signup-email-code').value='';switchMode()/* BLOCK B-ABB346B3BF END. */});
$('bv-auth-open').addEventListener('click',show);
$('bv-auth-close').addEventListener('click',()=>$('bv-auth-dialog').close());
$('bv-auth-migrate').addEventListener('click',()=>{/* BLOCK B-6FE8013F7F START: AREA A-455629A1 */mode='migrate';switchMode();$('bv-auth-message').textContent='舊帳號：驗證原 Gmail 後設定新密碼。';/* BLOCK B-6FE8013F7F END. */});
$('bv-auth-switch').addEventListener('click',()=>{/* BLOCK B-2F89809CDE START: AREA A-455629A1 */mode=mode==='login'?'register':'login';switchMode()/* BLOCK B-2F89809CDE END. */});
$('bv-auth-email').addEventListener('input',()=>{/* BLOCK B-713538E534 START: AREA A-455629A1 */ $('bv-signup-challenge').value='';$('bv-signup-email-code').value='';$('bv-migrate-challenge').value='';$('bv-migrate-code').value=''; /* BLOCK B-713538E534 END. */});
$('bv-auth-form').addEventListener('submit',async e=>{/* BLOCK B-5BE650BE34 START: AREA A-455629A1 */
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
/* BLOCK B-5BE650BE34 END. */});
// Google Identity Services: ID token is verified by Worker using Google's JWKS.
let googleReady=false;
async function googleSignIn(response){/* BLOCK B-F4DDE90B3B START: AREA A-455629A1 */
 const msg=$('bv-auth-message');msg.textContent='正在驗證 Google 身分…';
 try{if(!response?.credential)throw Error('Google 未回傳登入憑證，請重新選擇帳號');const r=await request('/api/auth/google','POST',{credential:response.credential});if(!r.token)throw Error('伺服器未建立登入工作階段');token=r.token;localStorage.setItem(KEY,token);const me=await refresh();if(!me)throw Error('登入工作階段驗證失敗，請再試一次');$('bv-auth-dialog').close();$('bv-auth-password').value='';}
 catch(err){msg.textContent=err.message;}
/* BLOCK B-F4DDE90B3B END. */}
function renderGoogleButton(){/* BLOCK B-94585B8752 START: AREA A-455629A1 */
 const target=$('bv-google-signin'),hint=$('bv-google-hint');if(!target)return;
 const clientId=window.BV_GOOGLE_CLIENT_ID;
 if(!clientId){hint.textContent='管理員尚未設定 Google Client ID';return;}
 if(!window.google?.accounts?.id){hint.textContent='Google 登入模組載入中…';if(!target.dataset.retry){target.dataset.retry='1';let attempts=0;const retry=()=>{/* BLOCK B-EB08C60DD8 START: AREA A-455629A1 */if(!target.isConnected)return;if(window.google?.accounts?.id){delete target.dataset.retry;renderGoogleButton();return;}if(++attempts<25)setTimeout(retry,200);else{delete target.dataset.retry;hint.textContent='Google 登入模組載入失敗，請檢查網路或瀏覽器封鎖設定';}/* BLOCK B-EB08C60DD8 END. */};setTimeout(retry,200);}return;}
 if(!googleReady){google.accounts.id.initialize({client_id:clientId,callback:googleSignIn,auto_select:false});googleReady=true;}
 target.replaceChildren();google.accounts.id.renderButton(target,{theme:'outline',size:'large',text:'continue_with',width:290});hint.textContent='Google 驗證後可直接登入；相同 Gmail 的舊帳號會保留原有資料。';
/* BLOCK B-94585B8752 END. */}
$('bv-auth-logout').addEventListener('click',async()=>{/* BLOCK B-983C2674D0 START: AREA A-455629A1 */try{await request('/api/auth/logout','POST')}catch{}token='';email='';localStorage.removeItem(KEY);update();$('ai-ui-hint').textContent='已登出。請登入後使用 AI Chat。'/* BLOCK B-983C2674D0 END. */});
// Reload/reset only transient form data; retain login token and saved chats.
function clearTransientInputs(){/* BLOCK B-E89FEFE8C2 START: AREA A-455629A1 */
 const ids=['bv-auth-email','bv-auth-password','bv-signup-code','bv-signup-email-code','bv-signup-challenge','bv-migrate-code','bv-migrate-challenge','bv-auth-message','ai-message-input','ai-chat-search','cloud-search-input','ai-personal-key'];
 for(const id of ids){const el=$(id);if(!el)continue;if('value' in el)el.value='';else el.textContent='';}
 const dialog=$('bv-auth-dialog');if(dialog?.open)dialog.close();
 mode='login';signupMethod='email';setPasswordPanel(false);const method=$('bv-signup-method');if(method)method.value='email';switchMode();
/* BLOCK B-E89FEFE8C2 END. */}
// pageshow also runs when the browser restores a page from back/forward cache.
window.addEventListener('pageshow',clearTransientInputs);
window.BVAuth={getToken:()=>token,refresh,open:show,request};update();refresh();
/* BLOCK B-13C2926818 END. */})();

/* AREA A-455629A1 END. */
