/* BV DIARY v0.3.6: two cloud buttons only */
/* BV DIARY v0.2.3: anchored opening balance and rolling forecasts; local-first. */
(()=>{'use strict';
const root=document.getElementById('bv-diary'),nav=document.getElementById('global-page-nav');if(!root||!nav)return;
const KEY='bv-diary-v1',fmt=n=>'NT$'+Math.round(n).toLocaleString('en-US');
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const plusDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
const safe=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={schema:1,opening:0,transactions:[],debts:[],events:[],updatedAt:null};try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.schema===1&&Array.isArray(x.transactions)&&Array.isArray(x.debts)&&Array.isArray(x.events))state=x}catch{}
if(!/^\d{4}-\d{2}-\d{2}$/.test(state.anchorDate||''))state.anchorDate=today();
let forecastView='chart',hideCash=false,hideDebt=false;
let editing=null,calendarView='schedule';
let listSearch={finance:'',debt:''},listPage={finance:0,debt:0};
const PAGE_SIZE=15;
function compactList(kind){const debt=kind==='debt',arr=debt?state.debts:state.transactions,q=listSearch[kind].toLowerCase().trim();const filtered=arr.map((item,i)=>({item,i})).filter(({item})=>!q||[item.name,item.first,item.date,item.end].some(v=>String(v||'').toLowerCase().includes(q))).reverse();const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));listPage[kind]=Math.min(listPage[kind],pages-1);const page=listPage[kind],visible=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const entries=visible.map(({item:x})=>{const summary=debt?`剩餘 ${fmt(x.principal)} · 每 ${x.every} 天還款 ${fmt(x.payment)} · 首期 ${safe(x.first)}`:`${x.kind==='income'?'+':'−'}${fmt(x.amount)} / ${({'once':'單次','monthly':'每月','daily':'每日','interval':`每 ${x.every} 天`})[x.frequency]||safe(x.frequency)} · ${safe(x.date)}${x.end?' 至 '+safe(x.end):''}`;return `<li class="dy-compact-entry"><div class="dy-compact-info"><strong>${safe(x.name)}</strong><small>${summary}</small></div><span class="dy-actions"><button data-edit-${debt?'debt':'tx'}="${safe(x.id)}">編輯</button><button data-remove-${debt?'debt':'tx'}="${safe(x.id)}">刪除</button></span></li>`}).join('')||'<li>沒有符合條件的項目</li>';return `<div class="dy-list-tools"><input data-list-search="${kind}" placeholder="搜尋項目或日期" value="${safe(listSearch[kind])}" aria-label="搜尋${debt?'債務':'收支'}"><span>${filtered.length} 筆 · 新增優先</span></div><ul class="dy-list">${entries}</ul><div class="dy-list-pager"><button data-list-page="${kind}" data-step="-1" ${page===0?'disabled':''}>上一頁</button><span>${page+1} / ${pages}</span><button data-list-page="${kind}" data-step="1" ${page>=pages-1?'disabled':''}>下一頁</button></div>`}
// Rest days are persistent schedule records; generated target tasks are never persisted.
const restDays=()=>new Set(state.events.filter(e=>e.type==='rest').map(e=>e.date));
function targetDates(t){const start=t.start||t.date,end=t.endDate||t.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start)return [];const days=Math.round((Date.parse(end+'T12:00:00')-Date.parse(start+'T12:00:00'))/86400000)+1;if(days<1||days>3660)return [];const excluded=restDays();return Array.from({length:days},(_,i)=>plusDays(start,i)).filter(d=>!excluded.has(d))}
function targetDays(t){return targetDates(t).length}
// Stable pseudo-random stratified scheduling: deterministic across reloads, no generated task storage.
function targetCounts(t){
 const dates=targetDates(t),days=dates.length,n=Math.floor(Number(t.units)||0),counts=new Map();
 if(!days||n<=0)return counts;
 if(t.distribution!=='random'){
  dates.forEach((day,i)=>counts.set(day,Math.floor(n*(i+1)/days)-Math.floor(n*i/days)));
  return counts;
 }
 // Each date gets the same base count; extras occupy separated random strata.
 const base=Math.floor(n/days),extra=n%days;
 dates.forEach(day=>counts.set(day,base));
 let seed=2166136261;
 const signature=[t.id||'',t.start||t.date||'',t.endDate||'',n,dates.join(','),t.scheduleSeed||''].join('|');
 for(let i=0;i<signature.length;i++){seed=Math.imul(seed^signature.charCodeAt(i),16777619)>>>0}
 function rand(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296}
 if(extra){
  const picked=new Set();
  for(let k=0;k<extra;k++){
   const begin=Math.floor(k*days/extra),end=Math.floor((k+1)*days/extra);
   const candidates=[];
   for(let i=begin;i<end;i++)if(!picked.has(i))candidates.push(i);
   const chosen=candidates[Math.floor(rand()*candidates.length)];
   picked.add(chosen);counts.set(dates[chosen],counts.get(dates[chosen])+1);
  }
 }
 return counts;
}
function targetCount(t,day){return targetCounts(t).get(day)||0}
function dayEvents(day){const normal=state.events.filter(e=>e.type!=='target'&&e.date===day).map(e=>({kind:e.type==='rest'?'rest':'event',event:e}));const goals=state.events.filter(e=>e.type==='target'&&e.date===day).map(e=>({kind:'target',event:e}));const tasks=state.events.filter(e=>e.type==='target'&&targetCount(e,day)>0).map(e=>({kind:'task',event:e,count:targetCount(e,day)}));return [...normal,...goals,...tasks]}
function targetForm(item){return `<label>排程方式<select name="distribution"><option value="random" ${(item?.distribution||"random")==="random"?"selected":""}>隨機均勻散佈</option><option value="even" ${item?.distribution==="even"?"selected":""}>平均分配</option></select></label><label>預計開始時間<input name="start" type="date" required value="${safe(item?.start||item?.date||selected)}"></label><label>預期完成日期<input name="endDate" type="date" required value="${safe(item?.endDate||item?.date||selected)}"></label><label>子工作總數<input name="units" type="number" min="1" max="100000" step="1" required value="${item?.units||1}"></label><label>子工作定義<input name="unitLabel" maxlength="100" required placeholder="例如：看20頁書" value="${safe(item?.unitLabel||'')}"></label>`}

let explorerMenu=null,draggingId=null,dragTimer=null,dragStart=null;
let explorerOpen=localStorage.getItem('bv-diary-explorer-open')==='1';
let transferPhase='';
let cloudBase=null,cloudRevision=0,cloudUserToken=null,cloudBusy=false,cloudStatus='尚未同步雲端';

let tab='overview',month=new Date(today()+'T12:00:00'),selected=today(),directory=null;
function persist(){cloudStatus='本地變更尚未上傳';state.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));}
function orderedEvents(){
 const now=today();
 // v0.2.2: explicitly moved events have permanent manual order;
 // date proximity is used only for events without a manual rank.
 return state.events.filter(e=>e.type!=='rest').sort((a,b)=>{
  const pa=Number.isFinite(a.priority)?a.priority:null,pb=Number.isFinite(b.priority)?b.priority:null;
  if(pa!==null&&pb!==null&&pa!==pb)return pa-pb;
  if(pa!==null&&pb===null)return -1;if(pa===null&&pb!==null)return 1;
  const da=Math.abs(new Date(a.date+'T12:00:00')-new Date(now+'T12:00:00'));
  const db=Math.abs(new Date(b.date+'T12:00:00')-new Date(now+'T12:00:00'));
  return da-db||a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id));
 });
}
function explorer(){return `<aside class="dy-side" id="dy-explorer-sidebar" aria-label="DIARY-EXPLORER"><div class="dy-row"><h3>DIARY-EXPLORER</h3><button type="button" data-explorer-toggle aria-label="關閉 DIARY-EXPLORER">×</button></div><p class="dy-muted">距今天最近優先 · 長按拖曳或定點移動</p><ol class="dy-explorer-list">${orderedEvents().map((e,i)=>`<li class="dy-explorer-entry ${e.type==='target'?'dy-target':e.type==='rest'?'dy-rest':''}" data-explorer-id="${safe(e.id)}" tabindex="0"><div class="dy-explorer-card"><span class="dy-explorer-handle" aria-hidden="true">⠿</span><span class="dy-explorer-number">${i+1}</span><span class="dy-explorer-info"><strong>${e.type==='target'?'🎯 ':e.type==='rest'?'☕ ':''}${safe(e.title)}</strong><small>${e.type==='target'?'目標 · '+safe(e.start||e.date)+' → '+safe(e.endDate||e.date)+' · '+e.units+' 個子工作':(e.type==='rest'?'休息日 · ':'')+safe(e.date)}</small></span><button type="button" data-explorer-menu="${safe(e.id)}" aria-label="日程選項">⋯</button></div>${explorerMenu===e.id?`<div class="dy-explorer-context" role="group" aria-label="${safe(e.title)} 操作"><button type="button" data-explorer-edit="${safe(e.id)}">編輯</button><button type="button" data-explorer-move="${safe(e.id)}">移動</button><button type="button" data-explorer-delete="${safe(e.id)}">刪除</button><button type="button" data-explorer-close>取消</button></div>`:''}${editing?.kind==='event'&&editing.id===e.id?`<div class="dy-explorer-inline">${editPanel()}</div>`:''}${editing?.kind==='move'&&editing.id===e.id?`<form class="dy-explorer-inline dy-move-form" id="dy-move-event"><label>移動到指定節點（位置）<input type="number" name="position" min="1" max="${orderedEvents().length}" step="1" inputmode="numeric" required value="${i+1}" aria-label="移動至第幾位"></label><button type="submit">確定移動</button><button type="button" data-cancel-edit>取消</button></form>`:''}</li>`).join('')||'<li class="dy-muted">尚無日程，可從日曆新增</li>'}</ol></aside>`}
function reorderEvent(sourceId,targetId){
 if(sourceId===targetId)return;
 const list=orderedEvents(),a=list.findIndex(e=>e.id===sourceId),b=list.findIndex(e=>e.id===targetId);
 if(a<0||b<0)return;
 const [moved]=list.splice(a,1);list.splice(b,0,moved);
 list.forEach((e,i)=>e.priority=i);persist();render();
}
function diaryApiUrl(){const base=String(window.BV_CLOUD_API_URL||'').replace(/\/+$/,'');if(!/^https:\/\//.test(base))throw Error('未設定 BV_CLOUD_API_URL');return base+'/api/diary'}
function diaryToken(){const token=window.BVAuth?.getToken?.();if(!token)throw Error('請先登入 BV-NOTE 帳號，再使用雲端 DIARY');return token}
async function diaryRequest(method,payload){const token=diaryToken();const r=await fetch(diaryApiUrl(),{method,headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});let result;try{result=await r.json()}catch{throw Error('雲端回應不是 JSON')};if(!r.ok){const error=new Error(result.error||'雲端錯誤 '+r.status);error.status=r.status;throw error}return result}
function cloneState(s){return JSON.parse(JSON.stringify(s))}
function cloudDelta(base,current){const ops=[];
 for(const key of ['opening','anchorDate'])if(JSON.stringify(base?.[key])!==JSON.stringify(current[key]))ops.push({op:'set',field:key,value:current[key]});
 for(const collection of ['transactions','debts','events']){
  const old=new Map((base?.[collection]||[]).map(x=>[x.id,x]));
  const now=new Map((current[collection]||[]).map(x=>[x.id,x]));
  for(const [id,item] of now)if(JSON.stringify(old.get(id))!==JSON.stringify(item))ops.push({op:'upsert',collection,id,value:item});
  for(const id of old.keys())if(!now.has(id))ops.push({op:'delete',collection,id});
 }
 return ops;
}
function transferStatus(label){transferPhase=label;const el=root.querySelector('#dy-transfer-progress');if(el){el.hidden=!label;el.querySelector('span').textContent=label}}
async function cloudSave(){if(cloudBusy)return;cloudBusy=true;transferStatus('雲端上傳：檢查版本…');try{
 const token=diaryToken();
 if(cloudUserToken!==token){cloudBase=null;cloudRevision=0;cloudUserToken=token}
 if(!cloudBase){const remote=await diaryRequest('GET');if(remote.exists){cloudBase=remote.data;cloudRevision=remote.revision;if(!confirm('雲端已有這個帳號的 DIARY。要以目前本地資料覆蓋雲端內容嗎？')){cloudStatus='已取消：雲端資料未變更';return}}else{cloudBase={schema:1,opening:0,anchorDate:state.anchorDate,transactions:[],debts:[],events:[]};cloudRevision=0}}
 // BV DIARY v0.3.5: empty-local cloud overwrite guard.
 // An empty initial diary must not silently delete non-empty cloud data, even when cloudBase is cached.
 const isInitialEmpty=s=>Number(s.opening)===0&&
  ['transactions','debts','events'].every(k=>Array.isArray(s[k])&&s[k].length===0);
 if(isInitialEmpty(state)){
  const remote=await diaryRequest('GET');
  if(remote.exists){
   cloudBase=remote.data;cloudRevision=remote.revision;
   const hasCloudData=!isInitialEmpty(remote.data);
   const destructive=cloudDelta(remote.data,state).some(op=>op.op==='delete'||(op.op==='set'&&op.field==='opening'));
   if(hasCloudData&&destructive){
    const warning='⚠️ 高風險操作：目前本地 DIARY 是空白初始日程表。\\n\\n若繼續存儲，雲端原有日程、收支、債務或期初金額可能被清除。\\n\\n建議先「載入」雲端資料或另行備份。\\n\\n第一步：確定仍要以空白日程表覆蓋雲端？';
    if(!confirm(warning)){cloudStatus='已取消：保留原有雲端資料';return}
    const typed=prompt('⚠️ 第二次確認：此操作可能永久清除雲端資料。\\n請輸入「覆蓋雲端」才能繼續：','');
    if(typed!=='覆蓋雲端'){cloudStatus='已取消：第二次確認未通過，雲端未變更';return}
   }
  }else{
   cloudBase={schema:1,opening:0,anchorDate:state.anchorDate,transactions:[],debts:[],events:[]};
   cloudRevision=0;
  }
 }
 const operations=cloudDelta(cloudBase,state);if(!operations.length){cloudStatus='雲端與本地已同步';return}
 transferStatus('雲端上傳：傳送 '+operations.length+' 筆變更並等待確認…');const result=await diaryRequest('PATCH',{baseRevision:cloudRevision,operations});cloudRevision=result.revision;cloudBase=cloneState(state);cloudStatus='已儲存雲端 · 版本 '+cloudRevision;
 }catch(err){cloudStatus=err.status===409?'版本衝突：另一裝置已更新，請先重新載入雲端資料':err.message;alert('DIARY 雲端儲存失敗：'+cloudStatus)}finally{cloudBusy=false;transferStatus('');const el=root.querySelector('#dy-status');if(el)el.textContent=cloudStatus}}
async function cloudLoad(){if(cloudBusy)return;cloudBusy=true;transferStatus('雲端下載：連線與接收資料中…');try{
 const token=diaryToken();const remote=await diaryRequest('GET');if(!remote.exists){cloudStatus='這個帳號尚未建立雲端 DIARY';return}
 if(!confirm('載入雲端 DIARY 將取代目前本地資料。建議先備份。確定繼續？'))return;
 const x=remote.data;if(x.schema!==1||!Array.isArray(x.events)||!Array.isArray(x.transactions)||!Array.isArray(x.debts))throw Error('雲端資料格式錯誤');
 transferStatus('雲端下載：驗證與套用資料…');state=cloneState(x);cloudUserToken=token;cloudBase=cloneState(x);cloudRevision=remote.revision;persist();cloudStatus='已載入雲端 · 版本 '+cloudRevision;render();
 }catch(err){cloudStatus=err.message;alert('載入失敗：'+cloudStatus)}finally{cloudBusy=false;transferStatus('');const el=root.querySelector('#dy-status');if(el)el.textContent=cloudStatus}}
function occurrence(tx,date){if(date<tx.date||(tx.end&&date>tx.end))return false;if(tx.frequency==='once')return date===tx.date;if(tx.frequency==='daily')return true;if(tx.frequency==='monthly'){const start=new Date(tx.date+'T12:00:00'),cur=new Date(date+'T12:00:00');return (cur.getFullYear()*12+cur.getMonth())>=(start.getFullYear()*12+start.getMonth())&&cur.getDate()===Math.min(start.getDate(),new Date(cur.getFullYear(),cur.getMonth()+1,0).getDate())}if(tx.frequency==='interval')return Math.round((new Date(date+'T12:00:00')-new Date(tx.date+'T12:00:00'))/86400000)%tx.every===0;return false}
// The opening balance is measured at the BEGINNING of anchorDate, before that day's entries.
// Only entries on/after anchorDate are applied; earlier entries are historical references.
function calculateBalances(){
 const anchor=state.anchorDate||today(),current=today();
 const end=new Date(current+'T12:00:00');end.setMonth(end.getMonth()+6);
 // Keep a bounded range to avoid freezing the UI on accidentally ancient anchors.
 const start=anchor<=current?anchor:current;
 const debtModels=state.debts.map(d=>({...d,remaining:Number(d.principal)||0}));
 let cash=Number(state.opening)||0,atToday=null,points=[];
 // When anchor is in the future, there is no well-defined current balance.
 if(anchor>current)return {points:[],cash:null,debt:null,error:'錨定日期不可晚於今天，請重新設定。'};
 const span=Math.round((new Date(current+'T12:00:00')-new Date(anchor+'T12:00:00'))/86400000);
 if(span>36525)return {points:[],cash:null,debt:null,error:'錨定日期距今超過 100 年，請重新設定。'};
 for(let day=start;day<iso(end);day=plusDays(day,1)){
  for(const tx of state.transactions)if(occurrence(tx,day))cash+=tx.kind==='income'?Number(tx.amount):-Number(tx.amount);
  for(const debt of debtModels){
   if(day>=debt.first&&debt.remaining>0){
    const elapsed=Math.round((new Date(day+'T12:00:00')-new Date(debt.first+'T12:00:00'))/86400000);
    const every=Math.max(1,Math.floor(Number(debt.every)||1));
    if(elapsed>=0&&elapsed%every===0){const pay=Math.min(debt.remaining,Number(debt.payment)||0);debt.remaining-=pay;cash-=pay;}
   }
  }
  const item={day,cash,debt:debtModels.reduce((sum,d)=>sum+d.remaining,0)};
  if(day===current)atToday=item;
  if(day>=current)points.push(item);
 }
 return {points,cash:atToday?.cash??cash,debt:atToday?.debt??0,error:null};
}
function forecast(){return calculateBalances().points}

function monthlyRows(points){const rows=[];for(let i=0;i<points.length;i++){const p=points[i],next=points[i+1];if(!next||next.day.slice(0,7)!==p.day.slice(0,7)){const group=points.filter(x=>x.day.slice(0,7)===p.day.slice(0,7));rows.push({month:p.day.slice(0,7),cash:p.cash,debt:p.debt,min:Math.min(...group.map(x=>x.cash))})}}return rows}
function tableForecast(points){return `<div class="dy-table-wrap"><table class="dy-forecast-table"><thead><tr><th scope="col">月份</th><th scope="col">期末帳面餘額</th><th scope="col">期末帳面債務</th><th scope="col">當月最低餘額</th><th scope="col">資金缺口</th></tr></thead><tbody>${monthlyRows(points).map(r=>`<tr><th scope="row">${r.month}</th><td class="${r.cash<0?'dy-negative':''}">${fmt(r.cash)}</td><td>${fmt(r.debt)}</td><td class="${r.min<0?'dy-negative':''}">${fmt(r.min)}</td><td class="${r.min<0?'dy-negative':'dy-success'}">${r.min<0?fmt(-r.min):'無'}</td></tr>`).join('')}</tbody></table></div><p class="dy-muted">每列為該日曆月份在預測期間內的期末數值；首月及末月可能為非完整月份。資金缺口為該月最低餘額低於零的幅度。</p>`}
function chart(points){if(!points.length)return '';
 const visibleKeys=[...(!hideCash?['cash']:[]),...(!hideDebt?['debt']:[])];
 const options=`<div class="dy-forecast-options"><label><input type="checkbox" id="dy-hide-cash" ${hideCash?'checked':''}>隱藏帳面餘額曲線</label><label><input type="checkbox" id="dy-hide-debt" ${hideDebt?'checked':''}>隱藏帳面債務曲線</label></div>`;
 if(!visibleKeys.length)return options+'<div class="dy-chart-empty">目前已隱藏所有曲線。取消勾選即可重新顯示。</div>';
 // Scale only from visible series; include extrema from ALL days, not sampled points.
 const values=points.flatMap(p=>visibleKeys.map(k=>p[k]));let min=Math.min(...values),max=Math.max(...values);
 // Keep the zero baseline visible when cash crosses zero; otherwise let the chart fill its height.
 if(!hideCash&&min<0&&max>0){min=Math.min(min,0);max=Math.max(max,0)}
 const rawSpan=max-min,pad=Math.max(rawSpan*.08,Math.abs(max)*.005,1);min-=pad;max+=pad;
 const left=18,right=642,top=16,bottom=194,width=right-left,height=bottom-top;
 const x=i=>left+i*width/Math.max(1,points.length-1),y=v=>bottom-(v-min)/(max-min)*height;
 const path=k=>points.map((p,i)=>(i?'L':'M')+x(i).toFixed(2)+' '+y(p[k]).toFixed(2)).join(' ');
 const cashSegments=[];
 if(!hideCash)for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],xa=x(i-1),xb=x(i),ya=y(a.cash),yb=y(b.cash);
  if((a.cash<0)===(b.cash<0))cashSegments.push(`<path d="M${xa.toFixed(2)} ${ya.toFixed(2)} L${xb.toFixed(2)} ${yb.toFixed(2)}" stroke="${a.cash<0?'#f06470':'#82d6aa'}"/>`);
  else {const f=(0-a.cash)/(b.cash-a.cash),xc=xa+(xb-xa)*f,yc=y(0);cashSegments.push(`<path d="M${xa.toFixed(2)} ${ya.toFixed(2)} L${xc.toFixed(2)} ${yc.toFixed(2)}" stroke="${a.cash<0?'#f06470':'#82d6aa'}"/>`,`<path d="M${xc.toFixed(2)} ${yc.toFixed(2)} L${xb.toFixed(2)} ${yb.toFixed(2)}" stroke="${b.cash<0?'#f06470':'#82d6aa'}"/>`)}
 }
 const zeroLine=min<=0&&max>=0?`<line x1="${left}" y1="${y(0).toFixed(2)}" x2="${right}" y2="${y(0).toFixed(2)}" class="dy-gridline" stroke-dasharray="4 3"/>`:'';
 return `${options}<div class="dy-chart-wrap"><svg class="dy-chart" data-forecast-chart="true" viewBox="0 0 660 210" role="img" aria-label="未來六個月預測圖。移動滑鼠或觸碰曲線區域查看日期與數值。" tabindex="0"><line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" class="dy-gridline"/><line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" class="dy-gridline"/>${zeroLine}${hideCash?'':`<g fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${cashSegments.join('')}</g>`}${hideDebt?'':`<path d="${path('debt')}" fill="none" stroke="#d1a66b" stroke-width="2.5"/>`}<line class="dy-hover-line" x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" visibility="hidden"/><g class="dy-hover-dots" visibility="hidden">${hideCash?'':`<circle class="dy-hover-cash" r="4" fill="#82d6aa" stroke="#101216" stroke-width="2"/>`}${hideDebt?'':`<circle class="dy-hover-debt" r="4" fill="#d1a66b" stroke="#101216" stroke-width="2"/>`}</g></svg><div class="dy-chart-tooltip" role="status" aria-live="off" hidden></div></div><div class="dy-muted">${hideCash?'':'🟢 帳面餘額（負值 🔴）　'}${hideDebt?'':'🟠 帳面債務'} · 將滑鼠移至圖上查看日期及金額（TWD）</div>`;
}
function chartHover(event){const svg=root.querySelector('[data-forecast-chart]');if(!svg)return;
 const points=forecast(),rect=svg.getBoundingClientRect(),tooltip=root.querySelector('.dy-chart-tooltip');if(!points.length||!rect.width)return;
 const ratio=660/rect.width,px=(event.clientX-rect.left)*ratio,left=18,right=642;
 const i=Math.max(0,Math.min(points.length-1,Math.round((px-left)/(right-left)*(points.length-1))));const p=points[i];
 const keys=[...(!hideCash?['cash']:[]),...(!hideDebt?['debt']:[])],values=points.flatMap(q=>keys.map(k=>q[k]));let min=Math.min(...values),max=Math.max(...values);const span=max-min,pad=Math.max(span*.08,Math.abs(max)*.005,1);min-=pad;max+=pad;
 const x=left+i*(right-left)/Math.max(1,points.length-1),y=v=>194-(v-min)/(max-min)*(194-16);
 const line=svg.querySelector('.dy-hover-line'),dots=svg.querySelector('.dy-hover-dots');line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('visibility','visible');dots.setAttribute('visibility','visible');
 if(!hideCash){const c=dots.querySelector('.dy-hover-cash');c.setAttribute('cx',x);c.setAttribute('cy',y(p.cash));c.setAttribute('fill',p.cash<0?'#f06470':'#82d6aa')}
 if(!hideDebt){const d=dots.querySelector('.dy-hover-debt');d.setAttribute('cx',x);d.setAttribute('cy',y(p.debt))}
 tooltip.hidden=false;tooltip.textContent=p.day+(hideCash?'':'　餘額：'+fmt(p.cash))+(hideDebt?'':'　債務：'+fmt(p.debt));
 tooltip.style.left=Math.max(0,Math.min(rect.width- Math.min(250,rect.width),x/660*rect.width-85))+'px';
}
function clearChartHover(){const svg=root.querySelector('[data-forecast-chart]');if(!svg)return;svg.querySelector('.dy-hover-line')?.setAttribute('visibility','hidden');svg.querySelector('.dy-hover-dots')?.setAttribute('visibility','hidden');const tip=root.querySelector('.dy-chart-tooltip');if(tip)tip.hidden=true}
function forecastPanel(points){return `<div class="dy-view-switch" role="group" aria-label="預測顯示模式"><button type="button" data-forecast-view="chart" aria-pressed="${forecastView==='chart'}">圖表模式</button><button type="button" data-forecast-view="table" aria-pressed="${forecastView==='table'}">表格模式</button></div>${forecastView==='chart'?chart(points):tableForecast(points)}`}
function editForm(kind,item){
 const tx=kind==='tx',debt=kind==='debt',event=kind==='event';
 if(event)return `<section class="dy-panel dy-edit-panel"><h3>編輯${item.type==='target'?'目標':item.type==='rest'?'休息日':'日程'}</h3><form id="dy-edit-event" class="dy-form"><label>${item.type==='rest'?'休息日（無需標題）':'日程名稱'}<input name="title" maxlength="100" ${item.type==='rest'?'':'required'} value="${safe(item.title||'')}"></label>${item.type==='target'?targetForm(item):`<label>日期<input name="date" type="date" required value="${item.date}"></label>`}<div class="dy-wide dy-actions"><button type="submit">儲存修改</button><button type="button" data-cancel-edit>取消</button></div></form></section>`;
 if(tx)return `<section class="dy-panel dy-edit-panel"><h3>編輯帳務</h3><form id="dy-edit-tx" class="dy-form"><label>項目<input name="name" maxlength="100" required value="${safe(item.name)}"></label><label>類型<select name="kind"><option value="expense" ${item.kind==='expense'?'selected':''}>支出</option><option value="income" ${item.kind==='income'?'selected':''}>收入</option></select></label><label>金額<input name="amount" type="number" min="1" step="1" required value="${item.amount}"></label><label>起始日期<input name="date" type="date" required value="${item.date}"></label><label>頻率<select name="frequency">${[['once','單次'],['monthly','每月'],['daily','每日'],['interval','每 N 天']].map(([v,l])=>`<option value="${v}" ${item.frequency===v?'selected':''}>${l}</option>`).join('')}</select></label><label>每 N 天<input name="every" type="number" min="1" value="${item.every||7}"></label><label>結束日期<input name="end" type="date" value="${item.end||''}"></label><div class="dy-wide dy-actions"><button type="submit">儲存修改</button><button type="button" data-cancel-edit>取消</button></div></form></section>`;
 if(debt)return `<section class="dy-panel dy-edit-panel"><h3>編輯債務</h3><form id="dy-edit-debt" class="dy-form"><label>項目<input name="name" maxlength="100" required value="${safe(item.name)}"></label><label>剩餘本金<input name="principal" type="number" min="1" step="1" required value="${item.principal}"></label><label>每期還款<input name="payment" type="number" min="1" step="1" required value="${item.payment}"></label><label>第一次還款日<input name="first" type="date" required value="${item.first}"></label><label>每 N 天還款<input name="every" type="number" min="1" step="1" required value="${item.every}"></label><div class="dy-wide dy-actions"><button type="submit">儲存修改</button><button type="button" data-cancel-edit>取消</button></div></form></section>`;
 return '';
}
/* BV DIARY v0.3.8: render edit panel in main content */
function editPanel(){if(!editing)return '';const key={tx:'transactions',debt:'debts',event:'events'}[editing.kind],item=state[key]?.find(x=>x.id===editing.id);if(!item){editing=null;return ''}return editForm(editing.kind,item)}
async function saveFile(){const stamp=new Date().toISOString().replace(/[:.]/g,'-'),filename='BV-DIARY-'+stamp+'.json',content=JSON.stringify(state,null,2);const blob=new Blob([content],{type:'application/json'});
 // Save As lets users choose the exact destination in supporting desktop browsers.
 if(window.showSaveFilePicker){try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'BV DIARY JSON',accept:{'application/json':['.json']}}]});const writer=await handle.createWritable();await writer.write(blob);await writer.close();return '已儲存 '+handle.name}catch(err){if(err.name==='AbortError')return '已取消儲存';throw err}}
 // Browser download fallback: destination is controlled by browser download settings.
 const url=URL.createObjectURL(blob);try{const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove()}finally{setTimeout(()=>URL.revokeObjectURL(url),10000)}return '已開始下載 '+filename+'（位置由瀏覽器下載設定決定）';
}
function render(){const result=calculateBalances(),p=result.points,last=p.at(-1)||{cash:0,debt:0},deficit=p.find(x=>x.cash<0);root.innerHTML=`<div class="dy-shell"><div class="dy-top"><div><h2>BV DIARY</h2><div class="dy-muted">本地優先 · 日曆與帳務</div></div><div class="dy-top-actions"><button type="button" id="dy-cloud-load" title="從雲端載入 DIARY 資料">載入</button><button type="button" id="dy-save-as" title="將目前 DIARY 資料增量存儲至雲端">存儲</button></div></div><div class="dy-tabs" role="tablist">${[['overview','總覽'],['calendar','日曆'],['finance','記帳'],['debt','債務']].map(([id,label])=>`<button type="button" data-tab="${id}" role="tab" aria-selected="${tab===id}">${label}</button>`).join('')}</div><div class="dy-layout">${explorerOpen?explorer():''}<div id="dy-content">${editing&&editing.kind!=='move'?editPanel():''}${tab==='overview'?`<div class="dy-grid"><section class="dy-panel"><div class="dy-muted">截至今日預估可動用現金</div><div class="dy-value">${result.error?safe(result.error):fmt(result.cash)}</div></section><section class="dy-panel"><div class="dy-muted">截至今日預估未償還本金</div><div class="dy-value">${result.error?"—":fmt(result.debt)}</div></section></div><section class="dy-panel"><h3>未來六個月預測</h3><p class="dy-muted">錨定日：${safe(state.anchorDate)}（當日開始前的期初金額）；已自動累計至 ${today()}。未來預測每日滾動更新。</p>${result.error?`<p class="dy-error">${safe(result.error)}</p>`:forecastPanel(p)}<div class="dy-row"><span>期末預測現金：${fmt(last.cash)}</span><span>期末預測債務：${fmt(last.debt)}</span></div>${deficit?`<p class="dy-error">資金缺口：${deficit.day} 起，最低預測餘額 ${fmt(Math.min(...p.map(x=>x.cash)))}；圖表負值區段以紅色顯示。</p>`:''}</section><section class="dy-panel"><h3>錨定起始日期與期初可動用現金</h3><p class="dy-muted">請輸入錨定日期「當天開始前」實際可動用的現金。系統將從該日期開始計算所有收支及還款，並每天更新今日餘額與未來六個月預測。修改錨定日期時，請同步核對期初現金，避免重複計算。</p><form id="dy-opening" class="dy-row"><label>錨定起始日期<input type="date" name="anchorDate" max="${today()}" value="${safe(state.anchorDate)}" required></label><label>期初可動用現金（NT$）<input type="number" name="opening" step="1" value="${state.opening}" required></label><button>更新計算基準</button></form></section>`:tab==='finance'?`<section class="dy-panel"><h3>新增收支</h3><form id="dy-tx" class="dy-form"><label>項目<input name="name" required maxlength="100" placeholder="例如：房租"></label><label>類型<select name="kind"><option value="expense">支出</option><option value="income">收入</option></select></label><label>金額<input name="amount" type="number" min="1" step="1" required></label><label>起始日期<input name="date" type="date" value="${today()}" required></label><label>頻率<select name="frequency"><option value="once">單次</option><option value="monthly">每月</option><option value="daily">每日</option><option value="interval">每 N 天</option></select></label><label>每 N 天（僅自訂週期）<input name="every" type="number" min="1" value="7"></label><label>結束日期（可留空）<input name="end" type="date"></label><div class="dy-wide"><button>新增帳務</button></div></form></section><section class="dy-panel"><h3>收支規則</h3>${compactList('finance')}</section>`:tab==='debt'?`<section class="dy-panel"><h3>新增債務（無息本金模型）</h3><form id="dy-debt" class="dy-form"><label>項目<input name="name" required maxlength="100"></label><label>剩餘本金<input name="principal" type="number" min="1" step="1" required></label><label>每期還款<input name="payment" type="number" min="1" step="1" required></label><label>第一次還款日<input name="first" type="date" value="${today()}" required></label><label>每 N 天還款<input name="every" type="number" min="1" value="30" required></label><div class="dy-wide"><button>新增債務</button></div></form></section><section class="dy-panel"><h3>債務清單</h3>${compactList('debt')}</section>`:tab==='calendar'?calendar():`<section class="dy-panel"><h3>BV DIARY 版本快照</h3><p class="dy-muted">瀏覽器儲存工作資料；選擇本地資料夾後可寫入帶時間戳的 JSON 快照並保留舊檔。無檔案系統 API 時改為下載。</p><div class="dy-row"><button id="dy-folder">選取 BV DIARY 資料夾</button><button id="dy-save">建立版本快照</button><button id="dy-import">匯入快照</button><input id="dy-import-file" type="file" accept=".json" hidden></div><p id="dy-history-msg" role="status"></p></section>`}</div></div></div>`}
// v0.2.5: keep the action popup anchored to its card without changing scroll.
function placeExplorerMenu(){
 const menu=root.querySelector('.dy-explorer-context');
 if(!menu||!explorerMenu)return;
 const button=[...root.querySelectorAll('[data-explorer-menu]')].find(x=>x.dataset.explorerMenu===explorerMenu);
 if(!button)return;
 const r=button.getBoundingClientRect();
 const width=188, margin=8;
 let left=Math.min(window.innerWidth-width-margin,Math.max(margin,r.right+6));
 if(left<r.right&&r.left-width-6>=margin)left=r.left-width-6;
 menu.style.left=left+'px';
 menu.style.top=Math.max(margin,Math.min(window.innerHeight-menu.offsetHeight-margin,r.top))+'px';
}
function renderPreservingExplorer(id){
 const side=root.querySelector('#dy-explorer-sidebar');
 const card=[...root.querySelectorAll('[data-explorer-id]')].find(x=>x.dataset.explorerId===id);
 const top=card?.getBoundingClientRect().top;
 const scroll=side?.scrollTop||0;
 const pageScroll=root.scrollTop;
 render();
 root.scrollTop=pageScroll;
 const next=root.querySelector('#dy-explorer-sidebar');
 if(next)next.scrollTop=scroll;
 const nextCard=[...root.querySelectorAll('[data-explorer-id]')].find(x=>x.dataset.explorerId===id);
 if(next&&nextCard&&Number.isFinite(top))next.scrollTop+=nextCard.getBoundingClientRect().top-top;
 placeExplorerMenu();
}
function calendar(){const first=new Date(month.getFullYear(),month.getMonth(),1).getDay(),count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),prefix=month.getFullYear()+'-'+String(month.getMonth()+1).padStart(2,'0')+'-';const schedule=calendarView==='schedule';return `<section class="dy-panel"><div class="dy-row"><h3>${month.getFullYear()} 年 ${month.getMonth()+1} 月</h3><div><button data-month="-1">←</button> <button data-month="1">→</button></div></div><div class="dy-view-switch" role="group" aria-label="日曆分類"><button data-calendar-view="schedule" aria-pressed="${schedule}">日程</button><button data-calendar-view="finance" aria-pressed="${!schedule}">帳務</button></div><div class="dy-cal">${['日','一','二','三','四','五','六'].map(x=>`<div class="dy-muted" style="text-align:center">${x}</div>`).join('')}${Array(first).fill('<div></div>').join('')}${Array.from({length:count},(_,i)=>{const d=prefix+String(i+1).padStart(2,'0'),hits=schedule?dayEvents(d).length:state.transactions.filter(t=>occurrence(t,d)).length;return `<button data-day="${d}" class="${d===today()?'dy-today':''} ${schedule&&restDays().has(d)?'dy-rest-day':''}" ${d===today()?'aria-current="date"':''} aria-pressed="${selected===d}">${i+1}${hits?`<small>${hits} 項</small>`:''}</button>`}).join('')}</div></section><section class="dy-panel"><h3>${selected} · ${schedule?'日程':'帳務'}</h3>${schedule?`<ul class="dy-list">${dayEvents(selected).map(({kind,event:e,count})=>kind==='task'?`<li class="dy-target-task"><span>↳ ${safe(e.unitLabel)} × ${count} · ${safe(e.title)}</span></li>`:`<li class="${kind==='target'?'dy-target':kind==='rest'?'dy-rest':''}"><span>${kind==='target'?'🎯 目標：':kind==='rest'?'☕ 休息日':''}${kind==='rest'?'':safe(e.title)}</span><span class="dy-actions"><button data-edit-event="${e.id}">編輯</button><button data-remove-event="${e.id}">刪除</button></span></li>`).join('')||'<li>無日程</li>'}</ul><form id="dy-event" class="dy-target-create"><label>類型<select name="type" data-event-type><option value="event">日程</option><option value="target">目標</option><option value="rest">標註為休息日</option></select></label><label data-event-title-field>標題<input name="title" placeholder="新增日程或目標" maxlength="100" required></label><div data-target-fields hidden>${targetForm(null).replaceAll(' required',' disabled required')}</div><button>新增</button></form>`:`<ul class="dy-list">${state.transactions.filter(t=>occurrence(t,selected)).map(t=>`<li><span>${safe(t.name)} · ${t.kind==='income'?'+':'−'}${fmt(t.amount)}</span><button data-edit-tx="${t.id}">編輯</button></li>`).join('')||'<li>當日無帳務</li>'}</ul><p class="dy-muted">帳務規則可在「記帳」頁面新增或編輯；此處僅顯示選定日期的帳務。</p>`}</section>`}

function validTarget(d){return /^\d{4}-\d{2}-\d{2}$/.test(d.start)&&/^\d{4}-\d{2}-\d{2}$/.test(d.endDate)&&d.endDate>=d.start&&Number.isInteger(Number(d.units))&&Number(d.units)>=1&&Number(d.units)<=100000&&!!d.unitLabel?.trim()&&targetDays({start:d.start,endDate:d.endDate})>0}
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();
root.addEventListener('keydown',e=>{if(!e.target.matches('[data-forecast-chart]'))return;if(e.key==='Escape')clearChartHover()});
root.addEventListener('pointermove',e=>{if(e.target.closest('[data-forecast-chart]'))chartHover(e)});
root.addEventListener('pointerleave',e=>{if(e.target.closest('.dy-chart-wrap'))clearChartHover()},true);
root.addEventListener('focusout',e=>{if(e.target.matches('[data-forecast-chart]'))clearChartHover()});
// BV DIARY v0.3.7: persistent cloud transfer progress (indeterminate, never fake a percent).
let dyCloudProgressBusy=false;
function dyCloudProgressStart(action){
 let el=document.getElementById('dy-cloud-progress-live');
 if(!el){
  el=document.createElement('div');
  el.id='dy-cloud-progress-live';
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.innerHTML='<span class="dy-cloud-progress-label"></span><progress aria-label="雲端操作進行中"></progress>';
  document.body.appendChild(el);
 }
 const label=el.querySelector('.dy-cloud-progress-label');
 label.textContent=action==='load'?'正在載入雲端資料…':'正在存儲雲端資料…';
 el.hidden=false;
 dyCloudProgressBusy=true;
}
function dyCloudProgressEnd(){
 const el=document.getElementById('dy-cloud-progress-live');
 if(el)el.hidden=true;
 dyCloudProgressBusy=false;
}
root.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;if(t.hasAttribute('data-explorer-toggle')){explorerOpen=!explorerOpen;localStorage.setItem('bv-diary-explorer-open',explorerOpen?'1':'0');explorerMenu=null;editing=null;render();return}else if(t.id==='dy-save-as'||t.id==='dy-cloud-load'){if(dyCloudProgressBusy)return;dyCloudProgressStart(t.id==='dy-save-as'?'save':'load');try{if(t.id==='dy-save-as')await cloudSave();else await cloudLoad()}finally{dyCloudProgressEnd()}return}else if(t.dataset.listPage){const kind=t.dataset.listPage;listPage[kind]=Math.max(0,listPage[kind]+Number(t.dataset.step||0));render();return}else if(t.dataset.explorerMenu){explorerMenu=explorerMenu===t.dataset.explorerMenu?null:t.dataset.explorerMenu;renderPreservingExplorer(t.dataset.explorerMenu);return}else if(t.hasAttribute('data-explorer-close')){explorerMenu=null;render();return}else if(t.dataset.explorerEdit){editing={kind:'event',id:t.dataset.explorerEdit};explorerMenu=null;explorerOpen=true;localStorage.setItem('bv-diary-explorer-open','1');render();root.querySelector('.dy-edit-panel')?.scrollIntoView({block:'nearest'});return}else if(t.dataset.explorerMove){editing={kind:'move',id:t.dataset.explorerMove};explorerMenu=null;render();return}else if(t.dataset.explorerDelete){const id=t.dataset.explorerDelete;explorerMenu=null;if(confirm('確定刪除此日程？')){state.events=state.events.filter(x=>x.id!==id);persist()}render();return}else if(t.hasAttribute('data-cancel-edit')){editing=null;render();return}else if(t.dataset.editTx||t.dataset.editDebt||t.dataset.editEvent){editing={kind:t.dataset.editTx?'tx':t.dataset.editDebt?'debt':'event',id:t.dataset.editTx||t.dataset.editDebt||t.dataset.editEvent};if(editing.kind==='tx')tab='finance';else if(editing.kind==='debt')tab='debt';else{explorerOpen=true;localStorage.setItem('bv-diary-explorer-open','1');calendarView='schedule'}render();root.querySelector('.dy-edit-panel')?.scrollIntoView({block:'nearest'});return}else if(t.dataset.calendarView){calendarView=t.dataset.calendarView;editing=null;render();return}else if(t.dataset.forecastView){forecastView=t.dataset.forecastView;render()}else if(t.dataset.tab){tab=t.dataset.tab;render()}else if(t.dataset.month){month.setMonth(month.getMonth()+Number(t.dataset.month));selected=iso(new Date(month.getFullYear(),month.getMonth(),1));render()}else if(t.dataset.day){selected=t.dataset.day;render()}else if(t.dataset.removeTx||t.dataset.removeDebt||t.dataset.removeEvent){const key=t.dataset.removeTx?'transactions':t.dataset.removeDebt?'debts':'events',id=t.dataset.removeTx||t.dataset.removeDebt||t.dataset.removeEvent;if(confirm('確定刪除此項目？')){if(editing?.id===id)editing=null;state[key]=state[key].filter(x=>x.id!==id);persist();render()}}else if(t.id==='dy-folder'){try{if(!window.showDirectoryPicker)throw Error('瀏覽器不支援資料夾直接寫入');directory=await showDirectoryPicker({mode:'readwrite'});if(directory.name!=='BV DIARY')throw Error('請選擇名稱為 BV DIARY 的資料夾');root.querySelector('#dy-history-msg').textContent='已連接 BV DIARY 資料夾'}catch(err){directory=null;root.querySelector('#dy-history-msg').textContent=err.message}}else if(t.id==='dy-save'){const stamp=new Date().toISOString().replace(/[:.]/g,'-'),filename=stamp+'.json',content=JSON.stringify(state,null,2);try{if(directory){const h=await directory.getFileHandle(filename,{create:true});const w=await h.createWritable();await w.write(content);await w.close();root.querySelector('#dy-history-msg').textContent='已保存 '+filename}else{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type:'application/json'}));a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);root.querySelector('#dy-history-msg').textContent='已下載 '+filename}}catch(err){root.querySelector('#dy-history-msg').textContent='保存失敗：'+err.message}}else if(t.id==='dy-import')root.querySelector('#dy-import-file').click()});
root.addEventListener('input',e=>{if(!e.target.matches('[data-list-search]'))return;const kind=e.target.dataset.listSearch;listSearch[kind]=e.target.value;listPage[kind]=0;const cursor=e.target.selectionStart;render();const input=root.querySelector(`[data-list-search="${kind}"]`);input?.focus();input?.setSelectionRange(cursor,cursor)});
root.addEventListener('change',async e=>{if(e.target.matches('[data-event-type]')){const fields=root.querySelector('[data-target-fields]');if(fields){fields.hidden=e.target.value!=='target';fields.querySelectorAll('input').forEach(x=>x.disabled=fields.hidden)}const title=root.querySelector('[data-event-title-field]');if(title){title.hidden=e.target.value==='rest';const input=title.querySelector('input');input.required=e.target.value!=='rest';input.disabled=e.target.value==='rest'}return}if(e.target.id==='dy-hide-cash'){hideCash=e.target.checked;render();return}if(e.target.id==='dy-hide-debt'){hideDebt=e.target.checked;render();return}if(e.target.id!=='dy-import-file'||!e.target.files[0])return;try{const obj=JSON.parse(await e.target.files[0].text());if(obj.schema!==1||!Array.isArray(obj.transactions)||!Array.isArray(obj.debts)||!Array.isArray(obj.events)||!Number.isFinite(Number(obj.opening)))throw Error('快照格式不符');if(!confirm('匯入會取代目前 DIARY 工作資料，請先匯出快照。確定？'))return;state=obj;if(!/^\d{4}-\d{2}-\d{2}$/.test(state.anchorDate||''))state.anchorDate=today();persist();render()}catch(err){alert('匯入失敗：'+err.message)}});
root.addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));if(f.id==='dy-move-event'){if(!editing||editing.kind!=='move')return;const source=editing.id;const position=Number(d.position);const ordered=orderedEvents();if(!Number.isInteger(position)||position<1||position>ordered.length){alert('請輸入 1 到 '+ordered.length+' 的整數位置');return}const destination=ordered[position-1];editing=null;reorderEvent(source,destination.id);return}if(f.id.startsWith('dy-edit-')){if(!editing)return;const key={tx:'transactions',debt:'debts',event:'events'}[editing.kind],item=state[key]?.find(x=>x.id===editing.id);if(!item)return alert('找不到原始紀錄');
 if(f.id==='dy-edit-tx'&&editing.kind==='tx'){if(!d.name.trim()||!(Number(d.amount)>0)||!['income','expense'].includes(d.kind)||!['once','monthly','daily','interval'].includes(d.frequency)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||(d.end&&d.end<d.date)||!(Number(d.every)>0))return alert('請檢查帳務欄位');Object.assign(item,{name:d.name.trim(),kind:d.kind,amount:Number(d.amount),date:d.date,frequency:d.frequency,every:Math.floor(Number(d.every)),end:d.end||null})}
 else if(f.id==='dy-edit-debt'&&editing.kind==='debt'){if(!d.name.trim()||!(Number(d.principal)>0&&Number(d.payment)>0&&Number(d.every)>0)||!/^\d{4}-\d{2}-\d{2}$/.test(d.first))return alert('請檢查債務欄位');Object.assign(item,{name:d.name.trim(),principal:Number(d.principal),payment:Number(d.payment),first:d.first,every:Math.floor(Number(d.every))})}
 else if(f.id==='dy-edit-event'&&editing.kind==='event'){if(item.type!=='rest'&&!String(d.title||'').trim())return alert('請檢查標題');if(item.type==='target'){if(!validTarget(d))return alert('請檢查目標日期、子工作總數及定義');Object.assign(item,{title:d.title.trim(),date:d.start,start:d.start,endDate:d.endDate,units:Number(d.units),unitLabel:d.unitLabel.trim(),distribution:d.distribution==='even'?'even':'random'});selected=d.start}else{if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date))return alert('請檢查日程日期');Object.assign(item,{title:item.type==='rest'?'':d.title.trim(),date:d.date});selected=d.date}month=new Date(selected+'T12:00:00')}
 else return;editing=null;persist();render();return;
 }else if(f.id==='dy-opening'){if(!Number.isFinite(Number(d.opening))||!/^\d{4}-\d{2}-\d{2}$/.test(d.anchorDate)||d.anchorDate>today())return alert('請填寫有效的期初金額與不晚於今天的錨定日期');state.opening=Number(d.opening);state.anchorDate=d.anchorDate}else if(f.id==='dy-tx'){if(!(Number(d.amount)>0)||d.end&&d.end<d.date)return alert('請檢查金額與日期');state.transactions.push({id:uid(),name:d.name.trim(),kind:d.kind,amount:Number(d.amount),date:d.date,frequency:d.frequency,every:Math.max(1,Number(d.every)||1),end:d.end||null})}else if(f.id==='dy-debt'){if(!(Number(d.principal)>0&&Number(d.payment)>0&&Number(d.every)>0))return;state.debts.push({id:uid(),name:d.name.trim(),principal:Number(d.principal),payment:Number(d.payment),first:d.first,every:Math.floor(Number(d.every))})}else if(f.id==='dy-event'){if(d.type!=='rest'&&!String(d.title||'').trim())return alert('請輸入標題');if(d.type==='target'){if(!validTarget(d))return alert('請檢查目標日期、子工作總數及定義');state.events.push({id:uid(),type:'target',title:d.title.trim(),date:d.start,start:d.start,endDate:d.endDate,units:Number(d.units),unitLabel:d.unitLabel.trim(),distribution:d.distribution==='even'?'even':'random'})}else if(d.type==='rest'){if(state.events.some(e=>e.type==='rest'&&e.date===selected))return alert('該日期已設定休息日，請編輯現有項目');state.events.push({id:uid(),type:'rest',date:selected,title:''})}else state.events.push({id:uid(),date:selected,title:d.title.trim()})}persist();render()});
// v0.2.2: clicking outside a card action menu dismisses it.
// Capture does not stop propagation; defer repaint until the original click finishes.
document.addEventListener('click',e=>{
 if(!explorerMenu||!document.body.classList.contains('diary-active'))return;
 if(e.target.closest('.dy-explorer-context, [data-explorer-menu]'))return;
 queueMicrotask(()=>{if(explorerMenu){explorerMenu=null;render()}});
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&explorerMenu&&document.body.classList.contains('diary-active')){
  explorerMenu=null;render();
 }
});
root.addEventListener('scroll',()=>{if(explorerMenu)placeExplorerMenu()},true);
root.addEventListener('wheel',()=>{if(explorerMenu)requestAnimationFrame(placeExplorerMenu)},{passive:true});
window.addEventListener('resize',()=>{if(explorerMenu)placeExplorerMenu()});
// BV DIARY v0.2.7: dismiss inline edit/move when clicking outside its card.
document.addEventListener('pointerdown',e=>{
 if(!document.body.classList.contains('diary-active')||!editing)return;
 if(editing.kind!=='move')return; // BV DIARY v0.3.7: never auto-dismiss edit forms
 const card=[...root.querySelectorAll('[data-explorer-id]')].find(x=>x.dataset.explorerId===editing.id);
 if(card?.contains(e.target))return;
 if(e.target.closest('.dy-explorer-context'))return;
 const id=editing.id;
 queueMicrotask(()=>{
  if(!editing||editing.id!==id)return;
  editing=null;
  explorerMenu=null;
  renderPreservingExplorer(id);
 });
},true);
root.addEventListener('contextmenu',e=>{const li=e.target.closest('[data-explorer-id]');if(!li)return;e.preventDefault();explorerMenu=li.dataset.explorerId;renderPreservingExplorer(li.dataset.explorerId);queueMicrotask(placeExplorerMenu)});
root.addEventListener('pointerdown',e=>{const li=e.target.closest('[data-explorer-id]');if(!li||e.target.closest('button'))return;
 const id=li.dataset.explorerId;dragStart={id,x:e.clientX,y:e.clientY};clearTimeout(dragTimer);
 dragTimer=setTimeout(()=>{draggingId=id;root.querySelector(`[data-explorer-id="${CSS.escape(id)}"]`)?.classList.add('dy-dragging')},420);
});
root.addEventListener('pointermove',e=>{if(dragStart&&!draggingId&&Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y)>9){clearTimeout(dragTimer);dragStart=null}});
root.addEventListener('pointerup',e=>{clearTimeout(dragTimer);if(!draggingId){dragStart=null;return}const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-explorer-id]');const id=draggingId;draggingId=null;dragStart=null;if(target)reorderEvent(id,target.dataset.explorerId);else render()});
// v0.3.3: native mobile scrolling emits pointercancel. Never rerender unless an actual card drag was active.
root.addEventListener('pointercancel',()=>{clearTimeout(dragTimer);const wasDragging=!!draggingId;draggingId=null;dragStart=null;if(wasDragging)render()});
root.addEventListener('keydown',e=>{const li=e.target.closest('[data-explorer-id]');if(!li||!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const list=orderedEvents(),i=list.findIndex(x=>x.id===li.dataset.explorerId),j=i+(e.key==='ArrowUp'?-1:1);if(j>=0&&j<list.length){reorderEvent(list[i].id,list[j].id);root.querySelector(`[data-explorer-id="${CSS.escape(list[i].id)}"]`)?.focus()}});
function enter(){document.body.classList.add('diary-active');root.hidden=false;nav.querySelectorAll('button[data-page]').forEach(b=>b.removeAttribute('aria-current'));nav.querySelector('[data-page="diary"]').setAttribute('aria-current','page');render()}
function leave(){document.body.classList.remove('diary-active');root.hidden=true;nav.querySelector('[data-page="diary"]').removeAttribute('aria-current')}
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(!b)return;if(b.dataset.page==='diary'){e.stopImmediatePropagation();enter()}else if(document.body.classList.contains('diary-active')){leave();/* existing unified-ui handler performs navigation */}},true);
const globalToggle=document.getElementById('global-explorer-toggle');if(globalToggle)globalToggle.addEventListener('click',e=>{if(!document.body.classList.contains('diary-active'))return;e.preventDefault();e.stopImmediatePropagation();explorerOpen=!explorerOpen;localStorage.setItem('bv-diary-explorer-open',explorerOpen?'1':'0');explorerMenu=null;editing=null;render()},true);
window.BVDiary={open:enter,close:leave};
})();
