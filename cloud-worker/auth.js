import {neon} from '@neondatabase/serverless';
const encoder=new TextEncoder();
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const newUUID=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
const bad=(message,status=400)=>json({error:message},status);
const dateTW=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
// Native WebCrypto avoids exhausting the Workers CPU budget.
// The 100,000 iteration cap is required by the deployed Workers runtime.
const PASSWORD_SCHEME='pbkdf2-sha256-100000$';
async function derive(password,salt){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 return PASSWORD_SCHEME+b64(new Uint8Array(bits));
}

async function current(sql,req){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const hash=await digest(token);const rows=await sql`SELECT u.id,u.email,s.id AS session_id FROM bv_sessions s JOIN bv_users u ON u.id=s.user_id WHERE s.token_hash=${hash} AND s.expires_at>NOW() LIMIT 1`;return rows[0]||null;}
export async function authApi(req,env,path){if(!path.startsWith('/api/auth/')&&path!=='/api/ai/chat'&&path!=='/api/ai/chunk')return null;if(!env.DATABASE_URL)return bad('DATABASE_URL missing',503);const sql=neon(env.DATABASE_URL);let phase='route';try{
 // Legacy account migration requires proof of mailbox ownership. Never permit
 // replacing a password based on email address or signup code alone.
 if(path==='/api/auth/migrate/start'&&req.method==='POST'){
  if(!env.RESEND_API_KEY||!env.MIGRATION_FROM_EMAIL)return bad('管理員尚未設定郵件驗證服務',503);
  const b=await req.json();const email=String(b.email||'').trim().toLowerCase();
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)||email.length>254)return bad('請輸入有效 Gmail');
  phase='migration-request';
  const rows=await sql`SELECT id,password_hash FROM bv_users WHERE email=${email} LIMIT 1`;
  // Avoid disclosing whether the address exists or is eligible.
  if(!rows.length||String(rows[0].password_hash||'').startsWith(PASSWORD_SCHEME))return json({ok:true,message:'若符合遷移條件，驗證碼將寄至信箱'});
  const recent=await sql`SELECT COUNT(*)::int AS n FROM bv_auth_migrations WHERE email=${email} AND created_at>NOW()-INTERVAL '1 hour'`;
  if(Number(recent[0]?.n||0)>=3)return json({ok:true,message:'若符合遷移條件，驗證碼將寄至信箱'});
  const bytes=crypto.getRandomValues(new Uint8Array(6));const code=Array.from(bytes,x=>String(x%100).padStart(2,'0')).join('');
  const challenge=crypto.randomUUID();const hash=await digest(challenge+':'+code+':'+(env.MIGRATION_PEPPER||''));
  phase='migration-email';
  const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.MIGRATION_FROM_EMAIL,to:[email],subject:'BV-Note 帳號遷移驗證碼',text:'您的 BV-Note 帳號遷移驗證碼為：'+code+'\n10 分鐘內有效。若非本人操作請忽略。'})});
  if(!sent.ok){console.error('AUTH_MIGRATION_EMAIL_ERROR',sent.status);return bad('驗證郵件暫時無法寄送',503)}
  await sql`INSERT INTO bv_auth_migrations(id,email,code_hash,expires_at) VALUES(${challenge},${email},${hash},NOW()+INTERVAL '10 minutes')`;
  return json({ok:true,challenge_id:challenge,message:'驗證碼已寄出，10 分鐘內有效'});
 }
 if(path==='/api/auth/migrate/complete'&&req.method==='POST'){
  const b=await req.json();const email=String(b.email||'').trim().toLowerCase();const challenge=String(b.challenge_id||'');const code=String(b.code||'');const password=String(b.password||'');
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)||! /^[0-9a-f-]{36}$/i.test(challenge)||!/^[0-9]{12}$/.test(code)||password.length<12||password.length>128)return bad('遷移資料格式錯誤');
  phase='migration-verify';
  const codeHash=await digest(challenge+':'+code+':'+(env.MIGRATION_PEPPER||''));
  const claim=await sql`UPDATE bv_auth_migrations SET consumed_at=NOW() WHERE id=${challenge} AND email=${email} AND code_hash=${codeHash} AND consumed_at IS NULL AND expires_at>NOW() RETURNING id`;
  if(!claim.length)return bad('驗證碼錯誤、過期或已使用',403);
  phase='migration-derive';const salt=random(),hash=await derive(password,salt);
  phase='migration-update';
  const users=await sql`UPDATE bv_users SET password_salt=${salt},password_hash=${hash} WHERE email=${email} AND password_hash NOT LIKE ${PASSWORD_SCHEME+'%'} RETURNING id`;
  if(!users.length)return bad('此帳號已遷移或不存在',409);
  await sql`DELETE FROM bv_sessions WHERE user_id=${users[0].id}`;
  return json({ok:true,message:'遷移完成，請使用新密碼登入'});
 }
 // Email registration: verify mailbox ownership before creating any user.
 if(path==='/api/auth/register/email/start'&&req.method==='POST'){
  if(!env.RESEND_API_KEY||!env.MIGRATION_FROM_EMAIL||!env.MIGRATION_PEPPER)return bad('管理員尚未設定 Gmail 驗證服務',503);
  const b=await req.json();const email=String(b.email||'').trim().toLowerCase();
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)||email.length>254)return bad('請使用有效 Gmail');
  phase='email-signup-start';
  const exists=await sql`SELECT id FROM bv_users WHERE email=${email} LIMIT 1`;
  if(exists.length)return bad('此信箱已註冊，請登入或使用舊帳號遷移',409);
  const recent=await sql`SELECT COUNT(*)::int AS n FROM bv_auth_email_verifications WHERE email=${email} AND created_at>NOW()-INTERVAL '1 hour'`;
  if(Number(recent[0]?.n||0)>=3)return bad('驗證碼寄送過於頻繁，請稍後再試',429);
  const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>String(x%100).padStart(2,'0')).join('');
  const challenge=crypto.randomUUID();const hash=await digest(challenge+':'+code+':'+env.MIGRATION_PEPPER);
  // Store before delivery to avoid issuing an unredeemable challenge.
  await sql`INSERT INTO bv_auth_email_verifications(id,email,code_hash,expires_at) VALUES(${challenge},${email},${hash},NOW()+INTERVAL '10 minutes')`;
  phase='email-signup-send';
  const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.MIGRATION_FROM_EMAIL,to:[email],subject:'BV-Note Gmail 註冊驗證碼',text:'您的 BV-Note 註冊驗證碼為：'+code+'\n10 分鐘內有效。若非本人操作請忽略。'})});
  if(!sent.ok){console.error('AUTH_SIGNUP_EMAIL_ERROR',sent.status);await sql`DELETE FROM bv_auth_email_verifications WHERE id=${challenge}`;return bad('驗證郵件暫時無法寄送',503)}
  return json({ok:true,challenge_id:challenge,message:'驗證碼已寄出，10 分鐘內有效'});
 }
 if(path==='/api/auth/register/email/complete'&&req.method==='POST'){
  const b=await req.json();const email=String(b.email||'').trim().toLowerCase();const challenge=String(b.challenge_id||'');const code=String(b.code||'');const password=String(b.password||'');
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)||!/^[0-9a-f-]{36}$/i.test(challenge)||!/^[0-9]{12}$/.test(code)||password.length<12||password.length>128)return bad('驗證資料格式錯誤');
  if(!env.MIGRATION_PEPPER)return bad('管理員尚未設定驗證服務',503);
  phase='email-signup-verify';const codeHash=await digest(challenge+':'+code+':'+env.MIGRATION_PEPPER);
  const claimed=await sql`UPDATE bv_auth_email_verifications SET consumed_at=NOW() WHERE id=${challenge} AND email=${email} AND code_hash=${codeHash} AND consumed_at IS NULL AND expires_at>NOW() AND attempts<5 RETURNING id`;
  if(!claimed.length){await sql`UPDATE bv_auth_email_verifications SET attempts=attempts+1 WHERE id=${challenge} AND email=${email} AND consumed_at IS NULL AND expires_at>NOW()`;return bad('驗證碼錯誤、已過期或嘗試次數過多',403)}
  phase='email-signup-derive';const salt=random(),hash=await derive(password,salt),id=newUUID();
  phase='email-signup-create';const rows=await sql`INSERT INTO bv_users(id,email,password_salt,password_hash) VALUES(${id},${email},${salt},${hash}) ON CONFLICT(email) DO NOTHING RETURNING id`;
  if(!rows.length)return bad('此信箱已註冊，請登入或使用舊帳號遷移',409);
  return json({ok:true,message:'Gmail 驗證成功，帳號建立完成'},201);
 }
 if(path==='/api/auth/register'&&req.method==='POST'){
  if(!env.SIGNUP_CODE)return bad('註冊尚未開放：管理員需設定 SIGNUP_CODE',503);
  const b=await req.json();const email=String(b.email||'').trim().toLowerCase();const password=String(b.password||'');
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)||email.length>254)return bad('請使用 Gmail 地址');
  if(password.length<12||password.length>128)return bad('密碼長度須為 12～128 字元');
  phase='signup-code-digest';
  if(typeof b.signup_code!=='string'||await digest(b.signup_code)!==await digest(env.SIGNUP_CODE))return bad('註冊邀請碼不正確',403);
  phase='salt-generation';const salt=random();
  phase='password-derivation';const hash=await derive(password,salt);
  phase='uuid-generation';const id=newUUID();
  phase='database-insert';
  const rows=await sql`INSERT INTO bv_users(id,email,password_salt,password_hash) VALUES(${id},${email},${salt},${hash}) ON CONFLICT(email) DO NOTHING RETURNING id`;
  if(!rows.length)return bad('此信箱已註冊',409);return json({ok:true},201);
 }
 if(path==='/api/auth/login'&&req.method==='POST'){
  const b=await req.json(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
  if(email.length>254||password.length>128)return bad('帳號或密碼錯誤',401);
  const rows=await sql`SELECT id,email,password_salt,password_hash FROM bv_users WHERE email=${email} LIMIT 1`;
  const user=rows[0];
  if(!user)return bad('帳號或密碼錯誤',401);
  // The original 310k noble PBKDF2 hashes cannot be verified within the Free Worker CPU budget.
  // Do not silently downgrade or overwrite existing hashes.
  if(!String(user.password_hash||'').startsWith(PASSWORD_SCHEME))return bad('此帳號使用舊版密碼雜湊，請先進行帳號密碼遷移；原有密碼資料未被修改',409);
  if(await derive(password,user.password_salt)!==user.password_hash)return bad('帳號或密碼錯誤',401);
  const token=random(),hash=await digest(token),session=newUUID();
  await sql`INSERT INTO bv_sessions(id,user_id,token_hash,expires_at) VALUES(${session},${user.id},${hash},NOW()+INTERVAL '30 days')`;
  return json({token,email:user.email,expires_in_days:30});
 }
 const user=await current(sql,req);if(!user)return bad('請先登入或重新登入',401);
 if(path==='/api/auth/logout'&&req.method==='POST'){await sql`DELETE FROM bv_sessions WHERE id=${user.session_id}`;return json({ok:true});}
 if(path==='/api/auth/me'&&req.method==='GET'){
  const day=dateTW();const rows=await sql`SELECT used FROM bv_ai_usage WHERE user_id=${user.id} AND usage_day=${day}::date`;
  return json({email:user.email,limit:100,used:rows[0]?.used||0,remaining:100-(rows[0]?.used||0),day});
 }
 // v3.5.16 Local: charge once per verified-format local chunk manifest, no R2 upload.
 if(path==='/api/ai/chunk'&&req.method==='POST'){
  const fail=(code,message,status=400)=>json({error:message,error_id:code},status);
  const raw=await req.text();if(raw.length>2000)return fail('AI-UPLOAD-002','分片登記資料過大',413);
  let item;try{item=JSON.parse(raw)}catch{return fail('AI-UPLOAD-001','JSON 無效')}
  const id=String(item.upload_id||''),part=item.part_index,count=item.part_count,bytes=item.bytes,hash=String(item.sha256||'');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||!Number.isInteger(part)||!Number.isInteger(count)||count<1||count>200||part<0||part>=count||!Number.isInteger(bytes)||bytes<1||bytes>5*1024*1024||!/^[0-9a-f]{64}$/i.test(hash))return fail('AI-UPLOAD-001','分片登記參數無效');
  const day=dateTW();
  // The claim and daily credit reservation are atomic in one SQL statement.
  const result=await sql`WITH claim AS (
   INSERT INTO bv_ai_chunks(user_id,upload_id,part_index,part_count,bytes,usage_day)
   VALUES(${user.id},${id},${part},${count},${bytes},${day}::date)
   ON CONFLICT DO NOTHING RETURNING user_id
  ), charge AS (
   INSERT INTO bv_ai_usage(user_id,usage_day,used)
   SELECT ${user.id},${day}::date,1 FROM claim
   ON CONFLICT(user_id,usage_day) DO UPDATE SET used=bv_ai_usage.used+1
   WHERE bv_ai_usage.used<100 RETURNING used
  ) SELECT (SELECT COUNT(*)::int FROM claim) AS claimed,(SELECT COUNT(*)::int FROM charge) AS charged`;
  if(result[0]?.claimed&&!result[0]?.charged){await sql`DELETE FROM bv_ai_chunks WHERE user_id=${user.id} AND upload_id=${id} AND part_index=${part}`;return fail('AI-LIMIT-001','今日 AI 額度不足',429)}
  if(!result[0]?.claimed){const old=await sql`SELECT bytes,part_count FROM bv_ai_chunks WHERE user_id=${user.id} AND upload_id=${id} AND part_index=${part}`;if(Number(old[0]?.bytes)!==bytes||Number(old[0]?.part_count)!==count)return fail('AI-UPLOAD-003','重複分片參數不一致',409)}
  return json({ok:true,part,charged:result[0]?.claimed?1:0,mode:'local-manifest'});
 }
 if(path==='/api/ai/chat'&&req.method==='POST'){
  const trace=crypto.randomUUID();
  const fail=(id,message,status=502,extra={})=>json({error:message,error_id:id,trace_id:trace,...extra},status);
  const log=(id,phase,e,extra={})=>console.error('BV_AI_DIAGNOSTIC',JSON.stringify({error_id:id,trace_id:trace,phase,name:e?.name||'Error',...extra}));
  if(!env.OPENAI_API_KEY)return fail('AI-CFG-001','管理員尚未設定 OPENAI_API_KEY',503);
  let raw;try{raw=await req.text()}catch(e){log('AI-REQ-001','read-body',e);return fail('AI-REQ-001','無法讀取請求',400)}
  if(raw.length>60000)return fail('AI-REQ-002','文字請求超過 60,000 字元；請使用附件分片',413);
  let b;try{b=JSON.parse(raw)}catch{return fail('AI-REQ-003','JSON 格式錯誤',400)}
  if(!b||!Array.isArray(b.input)||b.input.length<1||b.input.length>30)return fail('AI-REQ-004','輸入格式錯誤',400);
  // Browser supplies bounded excerpts. Server verifies that every local chunk was accounted for.
  if(Array.isArray(b.uploads)&&b.uploads.length){
   if(b.uploads.length>10)return fail('AI-UPLOAD-005','最多 10 個附件',400);
   const contexts=[];
   for(const item of b.uploads){
    const id=String(item.id||''),count=Number(item.count),name=String(item.name||'attachment').slice(0,180),excerpt=String(item.excerpt||'');
    if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isInteger(count)||count<1||count>200||excerpt.length>3500)return fail('AI-UPLOAD-001','附件資訊無效');
    const rows=await sql`SELECT part_index FROM bv_ai_chunks WHERE user_id=${user.id} AND upload_id=${id} AND part_count=${count} ORDER BY part_index`;
    if(rows.length!==count||rows.some((r,i)=>Number(r.part_index)!==i))return fail('AI-UPLOAD-006','附件分片尚未全部登記',409);
    contexts.push(`\n--- ${name}（本地處理；僅前 ${excerpt.length} 字元提供 AI，其餘未上傳）---\n${excerpt}\n--- END ---`);
   }
   const last=b.input[b.input.length-1];
   if(!last||last.role!=='user')return fail('AI-REQ-004','最後訊息必須為使用者',400);
   if(typeof last.content==='string')last.content+='\n'+contexts.join('\n');
   else if(Array.isArray(last.content))last.content.push({type:'input_text',text:contexts.join('\n')});
   else return fail('AI-REQ-004','訊息格式無效');
  }
  const model=env.OPENAI_MODEL||'gpt-4.1-mini',day=dateTW();
  let reservation;
  try{reservation=await sql`INSERT INTO bv_ai_usage(user_id,usage_day,used) VALUES(${user.id},${day}::date,1) ON CONFLICT(user_id,usage_day) DO UPDATE SET used=bv_ai_usage.used+1 WHERE bv_ai_usage.used<100 RETURNING used`}
  catch(e){log('AI-DB-001','quota-reserve',e);return fail('AI-DB-001','AI 額度資料庫操作失敗',503)}
  if(!reservation.length)return fail('AI-LIMIT-001','今日 AI 額度已用完（100/100）',429);
  let success=false;
  try{
   let response;
   try{response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model,input:b.input,max_output_tokens:1024,store:false}),redirect:'manual'})}
   catch(e){log('AI-WK-502','upstream-fetch',e);return fail('AI-WK-502','AI 服務連線失敗',502)}
   let body;
   try{body=await response.text()}catch(e){log('AI-WK-503','upstream-read',e);return fail('AI-WK-503','AI 回應讀取失敗',502)}
   if(!response.ok){const id='AI-UP-'+response.status;let code='unknown';try{const detail=JSON.parse(body);code=String(detail?.error?.code||detail?.error?.type||'unknown').slice(0,64)}catch{}log(id,'upstream-http',null,{upstream_status:response.status,upstream_code:code});return fail(id,'AI 上游服務拒絕請求',502,{upstream_status:response.status,upstream_code:code})}
   success=true;
   return new Response(body,{status:200,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-BV-Trace-ID':trace}});
  }catch(e){log('AI-WK-500','unexpected',e);return fail('AI-WK-500','AI 處理發生例外',500)}
  finally{if(!success){try{await sql`UPDATE bv_ai_usage SET used=GREATEST(0,used-1) WHERE user_id=${user.id} AND usage_day=${day}::date`}catch(e){log('AI-DB-002','quota-rollback',e)}}}
 }
 return bad('找不到路由',404);
 }catch(e){console.error('AUTH_API_ERROR',{phase,name:e?.name||'error',message:String(e?.message||'').slice(0,160)});return bad('服務暫時無法使用',500)}
}
