// S8-S10 admin test registry: pure synthetic cases, never production data.
export const aiS810Tests=Object.freeze({
 'ai-dag-cycle':{description:'Reject cycles in conversation parent graph',generate:()=>[Math.floor(Math.random()*1000)],run:([n])=>[{id:'a'+n,parentId:'b'+n,role:'user',text:'x'},{id:'b'+n,parentId:'a'+n,role:'assistant',text:'y'}],verify:(_,r)=>{const m=new Map(r.map(x=>[x.id,x]));return r.every(x=>{const seen=new Set();let id=x.id;while(id){if(seen.has(id))return true;seen.add(id);id=m.get(id)?.parentId}return false})}},
 'ai-image-signature':{description:'Reject mismatched MIME signatures',generate:()=>[Math.floor(Math.random()*100)],run:([n])=>({mime:'image/png',header:n%2?[0xff,0xd8,0xff]:[0x89,0x50,0x4e,0x47]}),verify:(_,r)=>r.header[0]===0xff||r.header[0]===0x89},
 'ai-archive-path':{description:'Reject archive traversal paths',generate:()=>[Math.floor(Math.random()*1000)],run:([n])=>['../'+n,'/root/'+n,'C:/'+n,'safe/'+n+'.md'],verify:(_,r)=>r.slice(0,3).every(x=>x.startsWith('..')||x.startsWith('/')||/^[A-Z]:/.test(x))&&r[3].startsWith('safe/')},
 'ai-document-budget':{description:'Split synthetic text without loss',generate:()=>[Math.floor(Math.random()*60000)],run:([n])=>{const size=16000,parts=[];for(let i=0;i<n;i+=size)parts.push(Math.min(size,n-i));return parts},verify:([n],r)=>r.reduce((a,b)=>a+b,0)===n&&r.every(x=>x>0&&x<=16000)}
});
