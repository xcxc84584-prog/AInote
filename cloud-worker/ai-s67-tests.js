// S6/S7 deterministic property tests; never make external API calls.
const req=(model,n)=>({model,input:Array.from({length:n},(_,i)=>({role:i%2?'assistant':'user',content:'x'})),max_output_tokens:2048});
const frames=(s)=>s.split('\n\n').filter(Boolean).map(x=>x.split('\n').find(l=>l.startsWith('data:'))?.slice(5).trim());
export const aiS67Tests=Object.freeze({
 'ai-request-model':{description:'S6 model allowlist',generate:()=>[Math.random()>.5?'gpt-5':'bad'],run:([m])=>['gpt-5','gpt-4.1','gpt-4.1-mini'].includes(m),verify:([m],v)=>v===(m==='gpt-5')},
 'ai-request-budget':{description:'S6 context limit',generate:()=>[Math.floor(Math.random()*70000)],run:([n])=>n<=60000,verify:([n],v)=>v===(n<=60000)},
 'ai-stream-frame':{description:'S7 split SSE framing',generate:()=>[Math.floor(Math.random()*1000)],run:([n])=>frames(`event: response.output_text.delta\ndata: {"delta":"${n}"}\n\n`),verify:([n],v)=>v.length===1&&JSON.parse(v[0]).delta===String(n)},
 'ai-stream-state':{description:'S7 terminal status invariant',generate:()=>[Math.floor(Math.random()*3)],run:([n])=>['completed','stopped','failed'][n],verify:([n],v)=>v===['completed','stopped','failed'][n]}
});
