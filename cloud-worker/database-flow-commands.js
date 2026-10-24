// BV-Note v3.9.5 database flow history / controlled test registry.
// Only registered pure functions are testable. No arbitrary eval, SQL, or dynamic imports from input.
const response=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const failure=(code,error,status=400)=>response({ok:false,code,error},status);
const pretty=n=>n>=1e9?(n/1e9).toFixed(2)+' GB':n>=1e6?(n/1e6).toFixed(2)+' MB':n>=1e3?(n/1e3).toFixed(2)+' KB':n+' B';
function range(value){
 const v=(value||'').trim().toUpperCase();
 if(v==='ALL')return {all:true,label:'ALL'};
 const months=v.split(',').map(s=>s.trim());
 if(months.length<1||months.length>2||months.some(s=>!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)))return null;
 if(months.length===2&&months[0]>months[1])return null;
 const begin=months[0]+'-01',endMonth=months[months.length-1];
 const [y,m]=endMonth.split('-').map(Number);const end=`${y+Math.floor(m/12)}-${String(m%12+1).padStart(2,'0')}-01`;
 return {all:false,start:begin,end,label:months.join('..')};
}
import {aiTestRegistry} from './ai-refactor-tests.js';
import {aiS345Tests} from './ai-s345-tests.js';
import {aiS67Tests} from './ai-s67-tests.js';
import {aiS810Tests} from './ai-s810-tests.js';
import {aiS1113Tests} from './ai-s1113-tests.js';
const testRegistry=Object.freeze({
 ...aiTestRegistry,
 ...aiS345Tests,
 ...aiS67Tests,
 ...aiS810Tests,
 ...aiS1113Tests,
 add:{arity:2,generate:()=>[Math.floor(Math.random()*2001)-1000,Math.floor(Math.random()*2001)-1000],run:([x,y])=>x+y,verify:([x,y],result)=>result===x+y}
});
async function audit(sql,user,code,message){
 await sql`INSERT INTO bv_console_logs(source,level,event_code,message) VALUES(${'db-admin:'+String(user).slice(0,36)},${'info'},${code},${String(message).slice(0,1800)})`;
}
function markdown(label,rows){
 const header=`# BV-Note Database Flow — ${label}\n\nGenerated: ${new Date().toISOString()}\n\n> Worker-observed estimates; not Neon billed network egress. Historical Storage is not available. Dates are UTC.\n\n`;
 const table='| Date (UTC) | Upload (bytes) | Download (bytes) | Egress Proxy (bytes) | Requests |\n|---|---:|---:|---:|---:|\n';
 const data=rows.map(r=>`| ${String(r.day).slice(0,10)} | ${r.upload_bytes} | ${r.download_bytes} | ${r.egress_proxy_bytes} | ${r.request_count} |`).join('\n');
 const total=rows.reduce((a,r)=>{for(const k of ['upload_bytes','download_bytes','egress_proxy_bytes','request_count'])a[k]+=BigInt(r[k]);return a},{upload_bytes:0n,download_bytes:0n,egress_proxy_bytes:0n,request_count:0n});
 return header+`Records: ${rows.length}\n\n`+table+data+'\n\n## Totals\n\n'+Object.entries(total).map(([k,v])=>`- ${k}: ${v}`).join('\n')+'\n';
}
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s)}
export async function flowCommands({command,data,admin,user,sql}){
 const m=command.match(/^\/(check|delete|download)\s+Data-Base-Flow(?:\s+<([^<>]+)>)?$/i);
 if(m){
  if(!admin)return failure('ADM-403','Administrator mode required',403);
  const action=m[1].toLowerCase(),r=range(m[2]||(action==='check'?new Date().toISOString().slice(0,7):''));
  if(!r)return failure('DBF-400','Use <YYYY-MM>, <YYYY-MM,YYYY-MM>, or <ALL>');
  if(action==='delete'){
   // Must confirm scope in a separate browser prompt; only flow counters are deleted.
   if(data.confirm!==`DELETE Data-Base-Flow ${r.label}`)return failure('DBF-428',`Confirmation required: DELETE Data-Base-Flow ${r.label}`,428);
   const rows=r.all?await sql`DELETE FROM bv_database_flow_daily RETURNING day`:await sql`DELETE FROM bv_database_flow_daily WHERE day>=${r.start}::date AND day<${r.end}::date RETURNING day`;
   await audit(sql,user,'DBF_DELETE',`scope=${r.label}; rows=${rows.length}`);
   return response({ok:true,lines:[`DATABASE FLOW DELETED | ${r.label}`,`Deleted daily rows: ${rows.length}`,'Only bv_database_flow_daily records were removed. Limits and user files were preserved.']});
  }
  const rows=r.all?await sql`SELECT day::text AS day,upload_bytes::text,download_bytes::text,egress_proxy_bytes::text,request_count::text FROM bv_database_flow_daily ORDER BY day`:await sql`SELECT day::text AS day,upload_bytes::text,download_bytes::text,egress_proxy_bytes::text,request_count::text FROM bv_database_flow_daily WHERE day>=${r.start}::date AND day<${r.end}::date ORDER BY day`;
  if(rows.length>12000)return failure('DBF-413','Too many daily rows for one export (max 12000)',413);
  const totals=rows.reduce((a,x)=>{a.upload+=BigInt(x.upload_bytes);a.download+=BigInt(x.download_bytes);a.egress+=BigInt(x.egress_proxy_bytes);a.requests+=BigInt(x.request_count);return a},{upload:0n,download:0n,egress:0n,requests:0n});
  if(action==='check'){
   const storage=await sql`SELECT pg_database_size(current_database())::bigint AS bytes`;
   return response({ok:true,lines:[`DATABASE FLOW | ${r.label} (UTC)`,`Daily records: ${rows.length}`,`Upload: ${pretty(Number(totals.upload))} (${totals.upload} B)`,`Download: ${pretty(Number(totals.download))} (${totals.download} B)`,`Worker Egress Proxy: ${pretty(Number(totals.egress))} (${totals.egress} B)`,`Requests: ${totals.requests}`,`Current DB Storage (not historical): ${pretty(Number(storage[0].bytes))}`,'Worker-observed estimates; NOT Neon billing.']});
  }
  const md=markdown(r.label,rows);const safe=r.label.replace(/[^A-Z0-9.-]/gi,'_');const filename=`BV-Note_Data-Base-Flow_${safe}`;
  // Build ZIP on server; browser receives base64 for safe, explicit download.
  const {default:JSZip}=await import('jszip');const zip=new JSZip();zip.file(filename+'.md',md);
  const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
  if(bytes.length>8*1024*1024)return failure('DBF-413','ZIP exceeds 8 MiB response limit',413);
  await audit(sql,user,'DBF_EXPORT',`scope=${r.label}; rows=${rows.length}`);
  return response({ok:true,lines:[`Export ready: ${filename}.zip`,`Rows: ${rows.length}; includes .md report.`],download:{filename:filename+'.zip',mime:'application/zip',base64:b64(bytes)}});
 }
 if(/^\/test\s+help$/i.test(command)){
  if(!admin)return failure('ADM-403','Administrator mode required',403);
  const entries=Object.entries(testRegistry);
  return response({ok:true,lines:['TEST TARGETS (admin only)',...entries.map(([name,t])=>`${name} | ${t.description||'Legacy arithmetic test'} | /test <${name}><frequency> (1..100)`),`${entries.length} registered targets.`]});
 }
 const test=command.match(/^\/test\s+<([^<>]+)><(\d+)>$/i);
 if(test){
  if(!admin)return failure('ADM-403','Administrator mode required',403);
  const name=test[1].trim().toLowerCase(),count=Number(test[2]);
  if(!Number.isSafeInteger(count)||count<1||count>100)return failure('TST-400','Frequency must be 1..100 per command');
  const target=testRegistry[name];if(!target)return failure('TST-404','Target not registered. Available: '+Object.keys(testRegistry).join(', '),404);
  let pass=0;const failed=[];
  for(let i=0;i<count;i++){
   const inputs=target.generate();let result,ok=false;
   try{result=target.run(inputs);ok=target.verify(inputs,result)}catch(e){result=String(e).slice(0,100)}
   if(ok)pass++;else failed.push({case:i+1,inputs,result});
  }
  await audit(sql,user,'TEST_RUN',JSON.stringify({target:name,total:count,passed:pass,failed:count-pass,examples:failed.slice(0,5)}));
  return response({ok:true,lines:[`TEST | ${name} | ${count} randomized cases`,`Passed: ${pass}`,`Failed: ${count-pass}`,'Summary saved to /log (event TEST_RUN).','Only allowlisted, side-effect-free targets are supported.']});
 }
 if(/^\/test(?:\s|$)/i.test(command))return failure('TST-400','Use /test <target><frequency>');
 return null;
}
