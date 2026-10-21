import {neon} from '@neondatabase/serverless';
const encoder=new TextEncoder();
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
const bad=(message,status=400)=>json({error:message},status);
const dateTW=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function derive(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:310000,hash:'SHA-256'},key,256)));}
async function current(sql,req){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const hash=await digest(token);const rows=await sql`SELECT u.id,u.email,s.id AS session_id FROM bv_sessions s JOIN bv_users u ON u.id=s.user_id WHERE s.token_hash=${hash} AND s.expires_at>NOW() LIMIT 1`;return rows[0]||null;}
export async function authApi(req,env,path){if(!path.startsWith('/api/auth/')&&path!=='/api/ai/chat')return null;if(!env.DATABASE_URL)return bad('DATABASE_URL missing',503);const sql=neon(env.DATABASE_URL);try{
 if(path==='/api/auth/register'&&req.method==='POST'){
  if(!env.SIGNUP_CODE)return bad('註冊尚未開放：管理員需設定 SIGNUP_CODE',503);
  const b=await req.json();const email=String(b.email||'').trim().toLowerCase();const password=String(b.password||'');
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)||email.length>254)return bad('請使用 Gmail 地址');
  if(password.length<12||password.length>128)return bad('密碼長度須為 12～128 字元');
  if(typeof b.signup_code!=='string'||await digest(b.signup_code)!==await digest(env.SIGNUP_CODE))return bad('註冊邀請碼不正確',403);
  const salt=random(),hash=await derive(password,salt),id=crypto.randomUUID();
  const rows=await sql`INSERT INTO bv_users(id,email,password_salt,password_hash) VALUES(${id},${email},${salt},${hash}) ON CONFLICT(email) DO NOTHING RETURNING id`;
  if(!rows.length)return bad('此信箱已註冊',409);return json({ok:true},201);
 }
 if(path==='/api/auth/login'&&req.method==='POST'){
  const b=await req.json(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
  if(email.length>254||password.length>128)return bad('帳號或密碼錯誤',401);
  const rows=await sql`SELECT id,email,password_salt,password_hash FROM bv_users WHERE email=${email} LIMIT 1`;
  const user=rows[0];if(!user||await derive(password,user.password_salt)!==user.password_hash)return bad('帳號或密碼錯誤',401);
  const token=random(),hash=await digest(token),session=crypto.randomUUID();
  await sql`INSERT INTO bv_sessions(id,user_id,token_hash,expires_at) VALUES(${session},${user.id},${hash},NOW()+INTERVAL '30 days')`;
  return json({token,email:user.email,expires_in_days:30});
 }
 const user=await current(sql,req);if(!user)return bad('請先登入或重新登入',401);
 if(path==='/api/auth/logout'&&req.method==='POST'){await sql`DELETE FROM bv_sessions WHERE id=${user.session_id}`;return json({ok:true});}
 if(path==='/api/auth/me'&&req.method==='GET'){
  const day=dateTW();const rows=await sql`SELECT used FROM bv_ai_usage WHERE user_id=${user.id} AND usage_day=${day}::date`;
  return json({email:user.email,limit:100,used:rows[0]?.used||0,remaining:100-(rows[0]?.used||0),day});
 }
 if(path==='/api/ai/chat'&&req.method==='POST'){
  if(!env.OPENAI_API_KEY)return bad('管理員尚未設定 OPENAI_API_KEY',503);
  const raw=await req.text();if(raw.length>60000)return bad('請求過大',413);
  let b;try{b=JSON.parse(raw)}catch{return bad('JSON 格式錯誤')}
  if(!b||!Array.isArray(b.input)||b.input.length<1||b.input.length>30)return bad('輸入格式錯誤');
  // Never accept a user-selected upstream model or arbitrary endpoint.
  const model=env.OPENAI_MODEL||'gpt-4.1-mini';const day=dateTW();
  const reservation=await sql`INSERT INTO bv_ai_usage(user_id,usage_day,used) VALUES(${user.id},${day}::date,1) ON CONFLICT(user_id,usage_day) DO UPDATE SET used=bv_ai_usage.used+1 WHERE bv_ai_usage.used<100 RETURNING used`;
  if(!reservation.length)return bad('今日 AI 額度已用完（100/100）',429);
  let success=false;
  try{
   const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model,input:b.input,max_output_tokens:1024,store:false}),redirect:'error'});
   const body=await response.text();success=response.ok;
   if(!response.ok)return bad('AI 服務暫時無法使用',502);
   return new Response(body,{status:200,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
  }catch{return bad('AI 服務連線失敗',502)}finally{
   if(!success)await sql`UPDATE bv_ai_usage SET used=GREATEST(0,used-1) WHERE user_id=${user.id} AND usage_day=${day}::date`;
  }
 }
 return bad('找不到路由',404);
 }catch(e){console.error('AUTH_API_ERROR',e?.name||'error');return bad('服務暫時無法使用',500)}
}
