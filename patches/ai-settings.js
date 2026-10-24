/* BV-Note 3.9.12.4: opt-in RAG, QA memory, token exponent. */
const KEY='bvnote-ai-performance-v39124';
const defaults={rag:false,memory:10,exponent:10};
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {rag:x.rag===true,memory:Number.isInteger(x.memory)?Math.min(25,Math.max(0,x.memory)):10,exponent:Number.isInteger(x.exponent)?Math.min(15,Math.max(8,x.exponent)):10}}catch{return {...defaults}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
window.BVAISettings={read,save};
const composer=document.getElementById('ai-chat-composer');
if(composer){
 const row=document.createElement('div');row.id='bv-ai-quickbar';
 const collapse=[...composer.querySelectorAll('button')].find(b=>/收合輸入框/.test(b.textContent));
 const attach=[...composer.querySelectorAll('button')].find(b=>/附件|付件/.test(b.textContent));
 const cont=document.getElementById('bv39121-continue')||[...composer.querySelectorAll('button')].find(b=>/繼續生成|重新載入回復/.test(b.textContent));
 for(const b of [collapse,attach,cont])if(b){row.append(b);if(b===cont)b.textContent='↻ 重新載入回覆'}
 const settings=document.createElement('button');settings.type='button';settings.textContent='⚙ 設定';settings.id='bv-ai-settings-toggle';row.append(settings);
 const panel=document.createElement('section');panel.id='bv-ai-settings-panel';panel.hidden=true;
 panel.innerHTML='<label><input id="bv-ai-use-rag" type="checkbox"> 使用 RAG（預設關閉）</label><label>記憶 Q/A 次數 <input id="bv-ai-memory" type="number" min="0" max="25" step="1"></label><label>單次輸出 Token 上限 2^n <input id="bv-ai-exp" type="number" min="8" max="15" step="1"><output id="bv-ai-token-preview"></output></label><button type="button" id="bv-ai-settings-save">保存設定</button>';
 const show=()=>{const s=read();panel.querySelector('#bv-ai-use-rag').checked=s.rag;panel.querySelector('#bv-ai-memory').value=s.memory;panel.querySelector('#bv-ai-exp').value=s.exponent;panel.querySelector('output').textContent=' = '+(2**s.exponent)+' tokens'};
 panel.querySelector('#bv-ai-exp').oninput=e=>{const n=Number(e.target.value);panel.querySelector('output').textContent=Number.isInteger(n)&&n>=8&&n<=15?' = '+2**n+' tokens':'（請輸入 8–15）'};
 settings.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)show()};
 panel.querySelector('#bv-ai-settings-save').onclick=()=>{const n=Number(panel.querySelector('#bv-ai-exp').value),m=Number(panel.querySelector('#bv-ai-memory').value);if(!Number.isInteger(n)||n<8||n>15||!Number.isInteger(m)||m<0||m>25)return alert('請輸入有效範圍：n=8–15、記憶=0–25');save({rag:panel.querySelector('#bv-ai-use-rag').checked,memory:m,exponent:n});panel.hidden=true};
 composer.prepend(panel);composer.prepend(row);
}
// RAG defaults off. Existing RAG interface remains available, but is not injected automatically.
