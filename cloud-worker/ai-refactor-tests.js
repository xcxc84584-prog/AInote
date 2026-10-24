// Pure, side-effect-free tests for S0-S2. Only used by admin /test allowlist.
const byteLimit=5*1024*1024;
export const aiTestRegistry=Object.freeze({
 'ai-schema':{description:'Validate conversation/message IDs and roles',arity:1,
   generate:()=>[Math.floor(Math.random()*1000000)],
   run:([n])=>({id:'c-'+n,role:n%2?'user':'assistant',conversationId:'c-1'}),
   verify:([n],r)=>r.id==='c-'+n&&['user','assistant'].includes(r.role)&&r.conversationId==='c-1'},
 'ai-chunk-boundary':{description:'Check <=5 MiB byte chunk boundary calculations',arity:1,
   generate:()=>[Math.floor(Math.random()*(byteLimit*4+1))],
   run:([bytes])=>{const parts=[];for(let pos=0;pos<bytes;pos+=byteLimit)parts.push(Math.min(byteLimit,bytes-pos));return parts},
   verify:([bytes],parts)=>parts.reduce((a,b)=>a+b,0)===bytes&&parts.every(b=>b>0&&b<=byteLimit)&&parts.length===Math.ceil(bytes/byteLimit)},
 'ai-message-order':{description:'Validate stable ordering of synthetic conversation messages',arity:1,
   generate:()=>[Math.floor(Math.random()*50)+1],
   run:([n])=>Array.from({length:n},(_,i)=>({id:'m-'+i,sequence:i})),
   verify:([n],r)=>r.length===n&&r.every((x,i)=>x.sequence===i&&x.id==='m-'+i)}
});
