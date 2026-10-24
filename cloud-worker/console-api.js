// BV-Note v3.8.9.4 FHI console with verified administrator access.
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
const enc=new TextEncoder();
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function signature(secret,payload){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(payload))))}
async function issueAdmin(secret,user){const payload=b64(enc.encode(JSON.stringify({user,exp:Date.now()+15*60*1000})));return payload+'.'+await signature(secret,payload)}
async function isAdmin(req,env,user){const token=req.headers.get('X-BV-Console-Admin')||'';if(!env.BV_CONSOLE_ADMIN_KEY||!token.includes('.'))return false;const [payload,sig]=token.split('.');if(!payload||!sig||sig!==await signature(env.BV_CONSOLE_ADMIN_KEY,payload))return false;try{const obj=JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));return obj.user===user&&Number.isFinite(obj.exp)&&obj.exp>Date.now()}catch{return false}}
const commands=[
 {syntax:'/help',description:'List available commands and basic usage.',tags:'help search'},
 {syntax:'/help <keyword>',description:'Search command names, syntax, descriptions, and keywords (case-insensitive).',tags:'help search filter'},
 {syntax:'/check File-Hash-ID-List',description:'List visible File-Hash-IDs (all accounts in Admin Mode).',tags:'check FHI list file document'},
 {syntax:'/delete ALL.FHI:<ID>',description:'Permanently delete a file and associated revisions. Confirmation required.',tags:'delete FHI all document'},
 {syntax:'/delete ID.FHI:<ID>',description:'Hide an FHI list entry only; preserve file, permissions, and revisions.',tags:'delete FHI hide list'},
 {syntax:'/delete PART.FHI:<ID><revision>',description:'Delete a specified commit revision; retain at least one revision.',tags:'delete FHI part revision'},
 {syntax:'/delete PART.FHI:<ID><[1,4,7]>',description:'Delete multiple commit revisions atomically.',tags:'delete FHI part revisions batch'},
 {syntax:'/delete ID.FHI:<ID> --user=<User-ID>',description:'Admin only: hide the FHI list entry for a specified account.',tags:'delete FHI hide user',admin:true},
 {syntax:'/check Account-List',description:'Admin only: list registered accounts.',tags:'check account user list',admin:true},
 {syntax:'/check ALL.Account-Flow:<UserID>',description:'Admin only: run all registered Account-Flow checks.',tags:'check account flow all',admin:true},
 {syntax:'/check PART.Account-Flow:<UserID><1>',description:'Admin only: run selected Account-Flow checks by number.',tags:'check account flow part',admin:true},
 {syntax:'/check PART.Account-Flow:<UserID><[2,7]>',description:'Admin only: run multiple numbered Account-Flow checks.',tags:'check account flow part batch',admin:true},
 {syntax:'/check TARGET.Account<[1,3]><[10000,10]><[H,H]>',description:'Admin: filter accounts by Account-Flow metric ranges (AND).',tags:'target account filter',admin:true},
 {syntax:'/ip',description:'Admin: last recorded IP for each account/guest.',tags:'ip audit',admin:true},
 {syntax:'/ip <UserID>',description:'Admin: historical IP for an account or guest ID.',tags:'ip history',admin:true},
 {syntax:'/check Data-Base-Flow',description:'Admin: show database storage and observed monthly transfer estimates.',tags:'database flow usage storage',admin:true},
 {syntax:'/set Data-Base-Limit <Resource><Limit><Unit>',description:'Admin: set Storage/Egress/Upload/Download limit (B,KB,MB,GB or UNLIMITED).',tags:'database limit set',admin:true},
 {syntax:'/log',description:'Admin: internal structured log overview (reserved for application reporters).',tags:'log internal',admin:true},
 {syntax:'/admin logout',description:'End the current administrator session.',tags:'logout session',admin:true}
];
async function getUser(sql,req){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];if(!token)return null;const hash=await digest(token);const rows=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`;return rows[0]?.user_id||null}
function fail(code,message,status=400){return reply({ok:false,code,error:message},status)}
export async function consoleApi(req,env,path,sql){if(path!=='/api/console/execute')return null;
if(req.method!=='POST')return fail('CMD-405','POST method required',405);
try{
const user=await getUser(sql,req);if(!user)return fail('AUTH-401','Sign in to BV-Note first',401);
const data=await req.json();const command=String(data?.command||'').trim();if(command.length>500)return fail('CMD-400','Command is too long');
const admin=await isAdmin(req,env,user);
const help=command.match(/^\/help(?:\s+(.+))?$/i);
if(help){const keyword=(help[1]||'').trim().replace(/^<|>$/g,'').toLowerCase();const found=commands.filter(c=>(!c.admin||admin)&&(!keyword||[c.syntax,c.description,c.tags].some(t=>t.toLowerCase().includes(keyword))));return reply({ok:true,lines:[keyword?`SEARCH RESULTS FOR "${keyword}"`:'AVAILABLE COMMANDS',...found.flatMap(c=>[c.syntax,'  '+c.description]),`${found.length} commands found.`]})}
if(/^\/admin(?:\s|$)/i.test(command)){
 if(/^\/admin\s+logout$/i.test(command))return reply({ok:true,adminToken:null,lines:['Administrator session ended.']});
 const key=command.match(/^\/admin\s+(.+)$/i)?.[1];if(!key)return fail('ADM-400','Administrator key required');
 if(!env.BV_CONSOLE_ADMIN_KEY)return fail('ADM-503','Administrator verification is not configured',503);
 const expected=await digest(env.BV_CONSOLE_ADMIN_KEY),actual=await digest(key);
 if(expected!==actual)return fail('ADM-403','Invalid administrator key',403);
 return reply({ok:true,adminToken:await issueAdmin(env.BV_CONSOLE_ADMIN_KEY,user),lines:['Administrator mode enabled for 15 minutes.','FHI commands can now access all accounts.']});
}
// Database Flow v3.9.4; counters are application estimates, not Neon billing.
if(/^\/check\s+Data-Base-Flow$/i.test(command)){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 const storage=await sql`SELECT pg_database_size(current_database())::bigint AS bytes`;
 const monthly=await sql`SELECT COALESCE(SUM(upload_bytes),0)::bigint AS upload,COALESCE(SUM(download_bytes),0)::bigint AS download,COALESCE(SUM(egress_proxy_bytes),0)::bigint AS egress,COALESCE(SUM(request_count),0)::bigint AS requests FROM bv_database_flow_daily WHERE day>=date_trunc('month',NOW() AT TIME ZONE 'UTC')::date AND day<(date_trunc('month',NOW() AT TIME ZONE 'UTC')+interval '1 month')::date`;
 const limits=await sql`SELECT resource,limit_bytes FROM bv_database_limits`;
 const map=new Map(limits.map(x=>[x.resource,x.limit_bytes===null?null:Number(x.limit_bytes)]));
 const pretty=n=>n===null?'Unlimited':n>=1e9?(n/1e9).toFixed(2)+' GB':n>=1e6?(n/1e6).toFixed(2)+' MB':n>=1e3?(n/1e3).toFixed(2)+' KB':n+' B';
 const line=(label,n,key)=>{const max=map.get(key);return `${label.padEnd(18)}: ${pretty(n)} / ${max===undefined?'N/A':pretty(max)}${max?` (${(n/max*100).toFixed(2)}%)`:''}`};
 const m=monthly[0],period=new Date().toISOString().slice(0,7);
 return reply({ok:true,lines:[`DATABASE FLOW | ${period} (UTC)`,line('Storage (SQL)',Number(storage[0].bytes),'Storage'),line('External Egress*',Number(m.egress),'Egress'),line('Upload*',Number(m.upload),'Upload'),line('Download*',Number(m.download),'Download'),`Observed requests: ${m.requests}`,'* Worker-observed application traffic; NOT Neon billed egress.','* Upload requires Content-Length; unmeasured bodies are omitted.','* Monitoring started on deployment; historical usage is unavailable.','* Limits are display thresholds, not enforced quotas.']});
}
const setLimit=command.match(/^\/set\s+Data-Base-Limit\s+<([^<>]+)><([^<>]+)><([^<>]+)>$/i);
if(setLimit){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 const aliases={storage:'Storage',egress:'Egress',upload:'Upload',download:'Download'};
 const resource=aliases[setLimit[1].trim().toLowerCase()];
 if(!resource)return fail('DBF-400','Resource must be Storage, Egress, Upload or Download');
 const value=setLimit[2].trim(),unit=setLimit[3].trim().toUpperCase();
 const scales={B:1,KB:1000,MB:1000000,GB:1000000000};
 let bytes=null;
 if(value.toUpperCase()==='UNLIMITED'&&unit==='B'){bytes=null}
 else{
  if(!/^(?:\d+)(?:\.\d{1,3})?$/.test(value)||!Object.hasOwn(scales,unit))return fail('DBF-400','Use positive number and B/KB/MB/GB; or <Unlimited><B>');
  bytes=Math.round(Number(value)*scales[unit]);
  if(!Number.isSafeInteger(bytes)||bytes<=0)return fail('DBF-400','Limit must be a positive safe integer number of bytes');
 }
 await sql`INSERT INTO bv_database_limits(resource,limit_bytes,updated_at) VALUES(${resource},${bytes},NOW()) ON CONFLICT(resource) DO UPDATE SET limit_bytes=EXCLUDED.limit_bytes,updated_at=NOW()`;
 return reply({ok:true,lines:[`Database limit updated: ${resource} = ${bytes===null?'Unlimited':value+' '+unit}`,'This is a monitoring threshold only.']});
}
if(/^\/check\s+Account-List$/i.test(command)){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 const rows=await sql`SELECT id,email,created_at FROM bv_users ORDER BY created_at DESC LIMIT 1000`;
 return reply({ok:true,lines:[`REGISTERED ACCOUNTS (${rows.length}${rows.length===1000?'+':''})`,...rows.map(r=>`${r.id} | ${r.email} | ${r.created_at}`)]});
}
const flow=command.match(/^\/check\s+(ALL|PART)\.Account-Flow:<([^<>]+)>(?:<((?:\d+)|(?:\[\s*\d+(?:\s*,\s*\d+)*\s*\]))>)?$/i);
if(flow){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 const mode=flow[1].toUpperCase(),identifier=flow[2].trim(),part=flow[3];
 if((mode==='ALL'&&part)||(mode==='PART'&&!part))return fail('FLOW-400','Invalid Account-Flow syntax');
 const account=await sql`SELECT id,email FROM bv_users WHERE id::text=${identifier} OR LOWER(email)=LOWER(${identifier}) LIMIT 1`;
 if(!account.length)return fail('FLOW-404','Account not found',404);
 const target=account[0],checks={
 1:async()=>{const r=await sql`SELECT COALESCE((SELECT SUM(octet_length(p.data)) FROM bv_cloud_parts p JOIN bv_cloud_uploads u ON u.id=p.upload_id WHERE u.owner_id=${target.id}),0)::bigint AS bytes`;return `1 | Cloud storage: ${(Number(r[0].bytes)/1024).toFixed(2)} KB (${r[0].bytes} bytes; stored upload parts)`},
 2:async()=>{const r=await sql`SELECT COALESCE((SELECT used FROM bv_ai_usage WHERE user_id=${target.id} AND usage_day=(NOW() AT TIME ZONE 'Asia/Taipei')::date),0)::int AS used`;return `2 | Website ChatGPT key calls today (Taipei): ${r[0].used}`},
 3:async()=>{const r=await sql`SELECT COALESCE(SUM(request_count),0)::bigint AS total,COALESCE(MAX(request_count),0)::bigint AS peak FROM bv_account_request_seconds WHERE user_id=${target.id} AND second_at >= date_trunc('day',NOW() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei' AND second_at < (date_trunc('day',NOW() AT TIME ZONE 'Asia/Taipei')+interval '1 day') AT TIME ZONE 'Asia/Taipei'`;return `3 | Requests today: ${r[0].total}; peak observed: ${r[0].peak} req/s (authenticated requests only)`}
 };
 const selected=mode==='ALL'?Object.keys(checks).map(Number):part.startsWith('[')?part.slice(1,-1).split(',').map(x=>Number(x.trim())):[Number(part)];
 if(!selected.length||selected.length>50||selected.some(x=>!Number.isSafeInteger(x)||!checks[x])||new Set(selected).size!==selected.length)return fail('FLOW-400','Unknown, repeated, or invalid Account-Flow number',400);
 const lines=[`ACCOUNT FLOW | ${target.email} | ${target.id}`];
 for(const n of selected)lines.push(await checks[n]());
 return reply({ok:true,lines});
}
// v3.8.9.4: registered and guest identities, parameterized queries only.
const target=command.match(/^\/check\s+TARGET\.Account<\[([^\]]+)\]><\[([^\]]+)\]><\[([^\]]+)\]>$/i);
if(target){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 const ids=target[1].split(',').map(x=>x.trim()), lows=target[2].split(',').map(x=>x.trim()), highs=target[3].split(',').map(x=>x.trim());
 if(!ids.length||ids.length>20||ids.length!==lows.length||ids.length!==highs.length||new Set(ids).size!==ids.length||ids.some(x=>!['1','2','3'].includes(x)))return fail('TARGET-400','Invalid or repeated metric IDs');
 const parse=(v,unlimited)=>v.toUpperCase()===unlimited?null:(/^\d+(?:\.\d+)?$/.test(v)&&Number.isFinite(Number(v))?Number(v):NaN);
 const lo=lows.map(x=>parse(x,'L')),hi=highs.map(x=>parse(x,'H'));
 if([...lo,...hi].some(x=>Number.isNaN(x))||lo.some((v,i)=>v!==null&&hi[i]!==null&&v>hi[i]))return fail('TARGET-400','Invalid range');
 const rows=await sql`SELECT 'account' AS kind,u.id::text AS identity,u.email AS label,
 COALESCE((SELECT SUM(octet_length(p.data)) FROM bv_cloud_parts p JOIN bv_cloud_uploads a ON a.id=p.upload_id WHERE a.owner_id=u.id),0)::bigint AS bytes,
 COALESCE((SELECT used FROM bv_ai_usage WHERE user_id=u.id AND usage_day=(NOW() AT TIME ZONE 'Asia/Taipei')::date),0)::int AS calls,
 COALESCE((SELECT MAX(request_count) FROM bv_account_request_seconds q WHERE q.user_id=u.id AND q.second_at>=NOW()-INTERVAL '24 hours'),0)::bigint AS peak
 FROM bv_users u ORDER BY u.created_at DESC LIMIT 1000`;
 const guests=await sql`SELECT guest_number,COALESCE((SELECT MAX(request_count) FROM bv_guest_request_seconds r WHERE r.guest_number=g.guest_number AND r.second_at>=NOW()-INTERVAL '24 hours'),0)::bigint AS peak FROM bv_console_guests g WHERE last_seen>=NOW()-INTERVAL '24 hours' ORDER BY guest_number LIMIT 1000`;
 const all=[...rows.map(r=>({name:r.label+' | '+r.identity,values:{1:Number(r.bytes)/1024,2:Number(r.calls),3:Number(r.peak)}})),...guests.map(g=>({name:'Guest-'+g.guest_number,values:{1:0,2:0,3:Number(g.peak)}}))];
 const found=all.filter(r=>ids.every((id,i)=>(lo[i]===null||r.values[id]>=lo[i])&&(hi[i]===null||r.values[id]<=hi[i])));
 return reply({ok:true,lines:[`TARGET ACCOUNT | matched ${found.length} of ${all.length} (maximum 1000 registered and 1000 guests)`,...found.map(r=>r.name+' | '+ids.map(id=>id+'='+r.values[id].toFixed(id==='1'?2:0)).join(' | '))]});
}
const ip=command.match(/^\/ip(?:\s+(.+))?$/i);
if(ip){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 if(!ip[1]){const rows=await sql`SELECT DISTINCT ON (identity) identity,ip,seen_at FROM bv_console_ip_history ORDER BY identity,seen_at DESC LIMIT 2000`;return reply({ok:true,lines:[`LATEST IP (${rows.length})`,...rows.map(r=>`${r.identity} | ${r.ip} | ${r.seen_at}`)]});}
 const key=ip[1].trim();if(key.length>200)return fail('IP-400','Invalid identity');
 let identity=key;if(!/^Guest-\d+$/i.test(key)){const users=await sql`SELECT id FROM bv_users WHERE id::text=${key} OR LOWER(email)=LOWER(${key}) LIMIT 1`;if(users.length)identity='Account-'+users[0].id;}
 const rows=await sql`SELECT ip,seen_at FROM bv_console_ip_history WHERE LOWER(identity)=LOWER(${identity}) ORDER BY seen_at DESC LIMIT 500`;
 return reply({ok:true,lines:[`IP HISTORY | ${identity} | ${rows.length} recent records`,...rows.map(r=>`${r.seen_at} | ${r.ip}`)]});
}
if(/^\/log$/i.test(command)){
 if(!admin)return fail('ADM-403','Administrator mode required',403);
 const rows=await sql`SELECT created_at,source,level,event_code,message FROM bv_console_logs ORDER BY created_at DESC LIMIT 100`;
 return reply({ok:true,lines:[`INTERNAL LOGS (${rows.length}; reporter hook ready)`,...rows.map(r=>`${r.created_at} | ${r.source} | ${r.level} | ${r.event_code} | ${r.message}`)]});
}
if(command==='/check File-Hash-ID-List'){
 const rows=await sql`SELECT d.file_id,d.owner_id,d.name,d.revision FROM bv_cloud_documents d WHERE (${admin} OR d.owner_id=${user}) AND NOT EXISTS(SELECT 1 FROM bv_console_hidden_fhi h WHERE h.owner_id=d.owner_id AND h.file_id=d.file_id) ORDER BY d.updated_at DESC LIMIT 500`;
 return reply({ok:true,lines:rows.length?rows.map(x=>`${x.file_id} | owner ${x.owner_id} | ${x.name} | revision ${x.revision}`):['No visible File-Hash-ID records found.']});
}
const m=command.match(/^\/delete\s+(ALL|ID|PART)\.FHI:<([^<>]+)>(?:<((?:\d+)|(?:\[\s*\d+(?:\s*,\s*\d+)*\s*\]))>)?(?:\s+--user=<([^<>]+)>)?$/i);
if(!m)return fail('CMD-400','Unknown or malformed command. Use /help for usage.');
const kind=m[1].toUpperCase(),file=m[2],part=m[3],targetUser=m[4];if(!uuid(file))return fail('FHI-400','File-Hash-ID must be a valid UUID');if(targetUser&&(kind!=='ID'||!admin||!uuid(targetUser)))return fail('FHI-403','The --user option requires Admin Mode and a valid User-ID',403);
if((kind==='PART'&&!part)||(kind!=='PART'&&part))return fail('FHI-400','Invalid revision syntax');
const owned=await sql`SELECT file_id,owner_id FROM bv_cloud_documents WHERE file_id=${file} AND (${admin} OR owner_id=${user})`;
if(!owned.length)return fail('FHI-404','File-Hash-ID not found or access denied',404);
if(kind==='ID'){
 const listOwner=targetUser||owned[0].owner_id;if(targetUser&&targetUser!==owned[0].owner_id)return fail('FHI-404','File-Hash-ID does not belong to the specified user',404);
 await sql`INSERT INTO bv_console_hidden_fhi(owner_id,file_id) VALUES(${listOwner},${file}) ON CONFLICT(owner_id,file_id) DO NOTHING`;
 return reply({ok:true,lines:[`Hidden FHI list entry ${file} for account ${listOwner}.`,'File, ownership, access permissions, and revisions are preserved.']});
}
if(data.confirm!==file)return fail('FHI-428','Confirm the exact File-Hash-ID before permanent deletion',428);
if(kind==='ALL'){
 const result=await sql`DELETE FROM bv_cloud_documents WHERE file_id=${file} AND (${admin} OR owner_id=${user}) RETURNING file_id`;
 return result.length?reply({ok:true,lines:[`Deleted file ${file} and cascading dependent records.`]}):fail('FHI-404','File not found or access denied',404);
}
const versions=part.startsWith('[')?part.slice(1,-1).split(',').map(x=>Number(x.trim())):[Number(part)];
if(versions.some(x=>!Number.isSafeInteger(x)||x<1)||new Set(versions).size!==versions.length||versions.length>50)return fail('FHI-400','Revisions must be unique positive integers (maximum 50)');
// Single SQL statement: validate all requested revisions, refuse last-version deletion,
// remove requested versions, then update document revision atomically.
const rows=await sql`WITH available AS (
 SELECT revision FROM bv_cloud_uploads WHERE file_id=${file} AND (${admin} OR owner_id=${user}) AND state='complete'
 UNION ALL SELECT revision FROM bv_delta_revisions WHERE file_id=${file} AND (${admin} OR owner_id=${user})
), guard AS (
 SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE revision=ANY(${versions}::int[]))::int AS matched FROM available
), removed_uploads AS (
 DELETE FROM bv_cloud_uploads WHERE file_id=${file} AND (${admin} OR owner_id=${user}) AND state='complete' AND revision=ANY(${versions}::int[])
 AND (SELECT matched FROM guard)=${versions.length} AND (SELECT total FROM guard)>${versions.length} RETURNING revision
), removed_delta AS (
 DELETE FROM bv_delta_revisions WHERE file_id=${file} AND (${admin} OR owner_id=${user}) AND revision=ANY(${versions}::int[])
 AND (SELECT matched FROM guard)=${versions.length} AND (SELECT total FROM guard)>${versions.length} RETURNING revision
), updated AS (
 UPDATE bv_cloud_documents SET revision=(SELECT MAX(revision) FROM available WHERE revision<>ALL(${versions}::int[])),updated_at=NOW()
 WHERE file_id=${file} AND (${admin} OR owner_id=${user}) AND (SELECT matched FROM guard)=${versions.length} AND (SELECT total FROM guard)>${versions.length}
 RETURNING revision
) SELECT (SELECT total FROM guard) AS total,(SELECT matched FROM guard) AS matched,(SELECT COUNT(*) FROM removed_uploads)+(SELECT COUNT(*) FROM removed_delta) AS deleted,(SELECT revision FROM updated) AS revision`;
const r=rows[0];if(Number(r.matched)!==versions.length)return fail('FHI-404','One or more revisions do not exist; no revisions were deleted',404);
if(Number(r.total)<=versions.length)return fail('FHI-409','At least one revision must remain; no revisions were deleted',409);
return reply({ok:true,lines:[`Deleted ${versions.length} revision(s): ${versions.join(', ')}`,`Latest revision: ${r.revision}`]});
}catch(e){console.error('Console API error',e);return fail('CMD-500','Server error; inspect Worker logs',500)}
}
