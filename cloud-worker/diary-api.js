/* BV DIARY v0.2.0 cloud: one revisioned JSON document per authenticated user. */
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const hex=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const collections=new Set(['events','transactions','debts']);
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));
const validItem=(type,x)=>{
 if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.id!=='string'||x.id.length>100)return false;
 if(type==='events')return typeof x.title==='string'&&x.title.length<=100&&validDate(x.date)&&(x.priority===undefined||(Number.isSafeInteger(x.priority)&&x.priority>=0));
 if(type==='transactions')return typeof x.name==='string'&&x.name.length<=100&&['income','expense'].includes(x.kind)&&Number.isFinite(x.amount)&&x.amount>0&&validDate(x.date)&&['once','monthly','daily','interval'].includes(x.frequency)&&Number.isSafeInteger(x.every)&&x.every>0&&(x.end===null||x.end===undefined||validDate(x.end));
 if(type==='debts')return typeof x.name==='string'&&x.name.length<=100&&Number.isFinite(x.principal)&&x.principal>0&&Number.isFinite(x.payment)&&x.payment>0&&Number.isSafeInteger(x.every)&&x.every>0&&validDate(x.first);
 return false;
};
function applyPatch(source,operations){
 const next=structuredClone(source);
 for(const op of operations){
  if(!op||typeof op!=='object')throw Error('無效變更');
  if(op.op==='set'&&op.field==='opening'&&Number.isFinite(op.value)&&Math.abs(op.value)<1e13){next.opening=op.value;continue}
  if(op.op==='set'&&op.field==='anchorDate'&&validDate(op.value)){next.anchorDate=op.value;continue}
  if(!collections.has(op.collection)||typeof op.id!=='string'||op.id.length>100)throw Error('無效變更欄位');
  const list=next[op.collection];const index=list.findIndex(x=>x.id===op.id);
  if(op.op==='delete'){if(index>=0)list.splice(index,1);continue}
  if(op.op==='upsert'&&validItem(op.collection,op.value)&&op.value.id===op.id){if(index>=0)list[index]=op.value;else list.push(op.value);continue}
  throw Error('無效操作');
 }
 if(next.events.length>3000||next.transactions.length>3000||next.debts.length>1000)throw Error('DIARY 項目數超過上限');
 if(JSON.stringify(next).length>1000000)throw Error('DIARY 資料過大');
 return next;
}
export async function diaryApi(req,env,path,sql){
 if(path!=='/api/diary')return null;
 if(!['GET','PATCH'].includes(req.method))return json({error:'Method not allowed'},405);
 const token=(req.headers.get('Authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{30,})$/)?.[1];
 if(!token)return json({error:'請先登入'},401);
 const hash=await hex(token);
 const users=await sql`SELECT user_id FROM bv_sessions WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`;
 if(!users.length)return json({error:'登入已過期'},401);
 const userId=users[0].user_id;
 try{
  const rows=await sql`SELECT revision,document FROM bv_diary_documents WHERE user_id=${userId} LIMIT 1`;
  if(req.method==='GET')return json(rows.length?{exists:true,revision:Number(rows[0].revision),data:rows[0].document}:{exists:false,revision:0});
  const contentLength=Number(req.headers.get('Content-Length')||0);
  if(contentLength>1100000)return json({error:'變更資料過大'},413);
  const raw=await req.text();if(raw.length>1100000)return json({error:'變更資料過大'},413);
  const body=JSON.parse(raw);
  if(!Number.isSafeInteger(body.baseRevision)||body.baseRevision<0||!Array.isArray(body.operations)||body.operations.length>4000)return json({error:'版本或變更格式錯誤'},400);
  const revision=rows.length?Number(rows[0].revision):0;
  if(body.baseRevision!==revision)return json({error:'版本衝突，請先載入最新雲端資料',revision},409);
  const base=rows.length?rows[0].document:{schema:1,opening:0,anchorDate:'2026-11-01',transactions:[],debts:[],events:[]};
  let next;try{next=applyPatch(base,body.operations)}catch(e){return json({error:e.message},400)}
  if(rows.length){
   const updated=await sql`UPDATE bv_diary_documents SET document=${JSON.stringify(next)}::jsonb,revision=revision+1,updated_at=NOW() WHERE user_id=${userId} AND revision=${revision} RETURNING revision`;
   if(!updated.length)return json({error:'版本衝突，請重新載入'},409);
   return json({ok:true,revision:Number(updated[0].revision)});
  }
  const inserted=await sql`INSERT INTO bv_diary_documents(user_id,revision,document) VALUES(${userId},1,${JSON.stringify(next)}::jsonb) ON CONFLICT(user_id) DO NOTHING RETURNING revision`;
  if(!inserted.length)return json({error:'版本衝突，請重新載入'},409);
  return json({ok:true,revision:1});
 }catch(e){console.error('DIARY cloud error',e);return json({error:'DIARY 雲端服務暫時不可用，請檢查資料表及 Worker 部署'},503)}
}
