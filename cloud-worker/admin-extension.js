import {report_webserver_powershell_log as log} from './console-log.js';
const out=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const err=(code,message,status=400)=>out({ok:false,code,error:message},status);
const safe=(x)=>String(x).slice(0,200);
function b64utf8(s){const bytes=new TextEncoder().encode(s);let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out)}
async function audit(sql,code,detail,level='info') {await log(sql,{source:'admin-v3911',level,event_code:code,message:JSON.stringify({kind:'real',target:'admin-extension',detail:safe(detail)})});}
function ident(s){return /^[a-z_][a-z0-9_]{0,62}$/i.test(s);}
export async function adminExtension({command,data,admin,user,sql}) {
 const recognized=/^\/(?:check\s+Data-Base-(?:Table|List|State)|ban-(?:id|ip|g)|delete\s+all\.log|download\s+all\.log|unban-(?:id|ip|g))\b/i.test(command);
 if(!recognized)return null;
 if(!admin)return err('ADM-403','Administrator mode required',403);
 const table=command.match(/^\/check\s+Data-Base-Table$/i);
 if(table){const rows=await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`;await audit(sql,'DB-TABLE-LIST',rows.length);return out({ok:true,lines:['DATABASE TABLES',...rows.map(r=>r.table_name)]});}
 const list=command.match(/^\/check\s+Data-Base-List\s+<([^<>]+)>$/i);
 if(list){const name=list[1].trim();if(!ident(name))return err('DB-400','Invalid table name');const rows=await sql`SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=${name} ORDER BY ordinal_position`;if(!rows.length)return err('DB-404','Table not found',404);await audit(sql,'DB-TABLE-SCHEMA',name);return out({ok:true,lines:[`TABLE ${name}`, ...rows.map(r=>`${r.column_name} | ${r.data_type} | nullable=${r.is_nullable} | default=${r.column_default??'-'}`)]});}
 const state=command.match(/^\/check\s+Data-Base-State\s+<([^<>]+)><([^<>]+)>$/i);
 if(state){const name=state[1].trim(),target=state[2].trim();if(!ident(name)||target.length>200)return err('DB-400','Invalid parameters');const cols=await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=${name}`;if(!cols.length)return err('DB-404','Table not found',404);const names=cols.map(r=>r.column_name);const key=['user_id','owner_id','account_id','id'].find(n=>names.includes(n));if(!key)return err('DB-422','No recognized user ownership column',422);const account=await sql`SELECT id FROM bv_users WHERE id::text=${target} OR LOWER(email)=LOWER(${target}) LIMIT 1`;if(!account.length)return err('DB-404','Account not found',404);const uid=String(account[0].id);const query=`SELECT to_jsonb(t) AS record FROM public."${name}" t WHERE t."${key}"::text=$1 LIMIT 25`;const rows=await sql.query(query,[uid]);const redacted=rows.map(r=>{const v={...r.record};for(const k of Object.keys(v)){if(/token|password|secret|key|hash|credential|code|content|data|body/i.test(k))v[k]='[REDACTED]'}return v});await audit(sql,'DB-USER-STATE',`${name}:${uid}:rows=${rows.length}`);return out({ok:true,lines:[`TABLE ${name} | account ${uid} | max 25 rows`,...redacted.map(r=>JSON.stringify(r))]});}
 const ban=command.match(/^\/(ban|unban)-(id|ip|g)\s+<([^<>]+)>$/i);
 if(ban){const [,action,kind,raw]=ban;const val=raw.trim().toLowerCase();if(val.length>254||!val)return err('BAN-400','Invalid target');if(kind==='ip'&&!/^[0-9a-f:.]{3,45}$/i.test(val))return err('BAN-400','Invalid IP');if(kind==='g'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))return err('BAN-400','Invalid email');if(kind==='id'&&!/^[0-9a-f-]{36}$/i.test(val))return err('BAN-400','Invalid user ID');if(action.toLowerCase()==='ban'){await sql`INSERT INTO bv_access_bans(kind,value,created_by) VALUES(${kind},${val},${user}) ON CONFLICT(kind,value) DO UPDATE SET created_by=EXCLUDED.created_by,created_at=NOW()`;}else{await sql`DELETE FROM bv_access_bans WHERE kind=${kind} AND value=${val}`;}await audit(sql,'BAN-CHANGE',`${action}:${kind}:${val}`,'warning');return out({ok:true,lines:[`${action.toUpperCase()} ${kind}: ${val}`]});}
 if(/^\/download\s+all\.log$/i.test(command)){const rows=await sql`SELECT created_at,source,level,event_code,message FROM bv_console_logs ORDER BY created_at DESC LIMIT 1000`;await audit(sql,'LOG-EXPORT',`rows=${rows.length}`);const md=['# BV-Note Logs',`Exported: ${new Date().toISOString()}`,'','```jsonl',...rows.map(r=>JSON.stringify(r)),'```'].join('\n');return out({ok:true,filename:'BV-Note-Logs.md',download:{filename:'BV-Note-Logs.md',mime:'text/markdown',base64:b64utf8(md)},lines:[`Export ready: ${rows.length} rows (max 1000).`,'Download payload is returned in download.content; client must save it.']});}
 if(/^\/delete\s+all\.log$/i.test(command)){if(data.confirm!=='DELETE ALL LOGS')return err('LOG-428','Confirmation required: DELETE ALL LOGS',428);const count=await sql`SELECT COUNT(*)::int AS n FROM bv_console_logs`;await sql`DELETE FROM bv_console_logs`;await audit(sql,'LOG-PURGE',`deleted=${count[0].n}`,'warning');return out({ok:true,lines:[`Deleted ${count[0].n} logs. New audit event retained.`]});}
 return err('CMD-400','Malformed admin extension command');
}
export async function accessGuard(req,env,path,sql){
 if(req.method==='OPTIONS')return null;
 const ip=(req.headers.get('CF-Connecting-IP')||'').toLowerCase();
 const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];
 let uid=null,email=null;
 if(token){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));const h=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');const rows=await sql`SELECT u.id,u.email FROM bv_sessions s JOIN bv_users u ON u.id=s.user_id WHERE s.token_hash=${h} AND s.expires_at>NOW() LIMIT 1`;uid=rows[0]?.id;email=rows[0]?.email?.toLowerCase();}
 const bans=await sql`SELECT kind,value FROM bv_access_bans WHERE (kind='ip' AND value=${ip}) OR (kind='id' AND value=${uid??''}) OR (kind='g' AND value=${email??''}) LIMIT 1`;
 if(!bans.length)return null;
 if(path==='/api/access/unlock'&&req.method==='POST'){
  const fingerprint=ip||'unknown';const rows=await sql`SELECT attempts,locked_until FROM bv_ban_unlock_attempts WHERE fingerprint=${fingerprint}`;
  if(rows[0]?.locked_until&&new Date(rows[0].locked_until).getTime()>Date.now())return err('BAN-429','Try again in 5 minutes',429);
  let body;try{body=await req.json()}catch{return err('BAN-400','Invalid JSON')};const provided=String(body?.adminKey||'');
  const hash=async v=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
  const a=await hash(provided),b=await hash(env.BV_CONSOLE_ADMIN_KEY||'');let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];
  if(!provided||!env.BV_CONSOLE_ADMIN_KEY||mismatch){const n=(Number(rows[0]?.attempts)||0)+1;await sql`INSERT INTO bv_ban_unlock_attempts(fingerprint,attempts,locked_until) VALUES(${fingerprint},${n>=5?0:n},${n>=5?new Date(Date.now()+300000).toISOString():null}) ON CONFLICT(fingerprint) DO UPDATE SET attempts=EXCLUDED.attempts,locked_until=EXCLUDED.locked_until`;await audit(sql,'BAN-UNLOCK-FAIL',`ip=${ip};attempt=${n}`,'warning');return err('BAN-403','Invalid administrator key',403);}
  await sql`DELETE FROM bv_access_bans WHERE (kind='ip' AND value=${ip}) OR (kind='id' AND value=${uid??''}) OR (kind='g' AND value=${email??''})`;
  await sql`DELETE FROM bv_ban_unlock_attempts WHERE fingerprint=${fingerprint}`;await audit(sql,'BAN-UNLOCK-SUCCESS',`ip=${ip}`,'warning');return out({ok:true,lines:['Ban cleared.']});
 }
 await audit(sql,'BAN-DENIED',`path=${path};ip=${ip}`,'warning');return err('BAN-403','Access denied. Use the unlock form with an administrator key.',403);
}
