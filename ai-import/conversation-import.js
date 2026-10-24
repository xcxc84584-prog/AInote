// BV-Note S3: local-only import; no network requests. Never executes imported markup.
// Official ChatGPT exports are often conversations.json inside a ZIP.
const MAX_ZIP_BYTES=100*1024*1024,MAX_JSON_BYTES=80*1024*1024,MAX_CHATS=20000;
const safeString=x=>typeof x==='string'?x:'';
const textOf=(message)=>{
 const c=message?.content||{};
 if(Array.isArray(c.parts))return c.parts.map(p=>typeof p==='string'?p:(p?.text||'[non-text content]')).join('\n');
 if(typeof c.text==='string')return c.text;
 return '[non-text content]';
};
export function normalizeChat(raw,index=0){
 const mapping=raw?.mapping;
 let nodes=[];
 if(mapping&&typeof mapping==='object'){
  nodes=Object.entries(mapping).map(([id,n])=>({id,parent:n?.parent||null,children:Array.isArray(n?.children)?n.children:[],message:n?.message})).filter(n=>n.message);
 }else if(Array.isArray(raw?.messages)){
  nodes=raw.messages.map((m,i)=>({id:String(m.id||`m-${i}`),parent:m.parent_id||null,children:[],message:m}));
 }else throw Error('IMPORT-SHAPE: unsupported conversation shape');
 if(nodes.length>100000)throw Error('IMPORT-LIMIT: too many messages');
 const messages=nodes.map((n,i)=>({id:n.id,parentId:n.parent,children:n.children,sequence:i,role:safeString(n.message?.author?.role||n.message?.role||'unknown'),text:textOf(n.message),createdAt:n.message?.create_time||null}));
 const id=safeString(raw?.id||raw?.conversation_id||`import-${index}`);
 return {id,title:safeString(raw?.title||'Untitled chat').slice(0,240),messages,source:'import',messageCount:messages.length};
}
export function parseMarkdownChat(md,title='Imported Markdown'){
 if(typeof md!=='string')throw TypeError('Markdown must be a string');
 const sections=md.split(/^\s*(?:#{1,4}\s*)?(?:Q(?:uestion)?|A(?:nswer)?|User|Assistant)\s*(?:\d+)?\s*[:：]\s*/gim);
 const labels=[...md.matchAll(/^\s*(?:#{1,4}\s*)?(Q(?:uestion)?|A(?:nswer)?|User|Assistant)\s*(?:\d+)?\s*[:：]\s*/gim)];
 const messages=labels.length?labels.map((m,i)=>({id:`md-${i}`,parentId:i?`md-${i-1}`:null,children:[],sequence:i,role:/^(q|question|user)$/i.test(m[1])?'user':'assistant',text:sections[i+1]?.trim()||'',createdAt:null})):[{id:'md-0',parentId:null,children:[],sequence:0,role:'user',text:md,createdAt:null}];
 return {id:'md-'+crypto.randomUUID(),title,source:'markdown',messageCount:messages.length,messages};
}
export async function parseChatFile(file,{signal,onProgress}={}){
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 if(file.size>MAX_ZIP_BYTES)throw Error('IMPORT-LIMIT: file exceeds 100 MiB');
 let data;
 if(/\.zip$/i.test(file.name)){
  if(!globalThis.JSZip)throw Error('IMPORT-DEPENDENCY: JSZip missing');
  const zip=await globalThis.JSZip.loadAsync(file);
  const entries=Object.values(zip.files).filter(x=>!x.dir);
  if(entries.length>1000)throw Error('IMPORT-LIMIT: too many ZIP entries');
  const entry=entries.find(x=>/(^|\/)conversations\.json$/i.test(x.name));
  if(!entry)throw Error('IMPORT-SHAPE: conversations.json missing');
  // JSZip uncompressedSize is internal metadata; use as preflight only.
  if(entry._data?.uncompressedSize>MAX_JSON_BYTES)throw Error('IMPORT-LIMIT: JSON too large');
  data=await entry.async('string');
 }else data=await file.text();
 if(new TextEncoder().encode(data).length>MAX_JSON_BYTES)throw Error('IMPORT-LIMIT: decoded text too large');
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 if(/\.(md|markdown|txt)$/i.test(file.name))return [parseMarkdownChat(data,file.name)];
 const parsed=JSON.parse(data),arr=Array.isArray(parsed)?parsed:(Array.isArray(parsed.conversations)?parsed.conversations:[parsed]);
 if(arr.length>MAX_CHATS)throw Error('IMPORT-LIMIT: too many conversations');
 const result=[];
 for(let i=0;i<arr.length;i++){
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  result.push(normalizeChat(arr[i],i));
  if(i%100===0)onProgress?.({done:i+1,total:arr.length});
 }
 return result;
}
export function catalogOf(chats){return chats.map(c=>({id:c.id,title:c.title,messageCount:c.messageCount,source:c.source}));}
export function uniqueImports(chats,existingIds=[]){const seen=new Set(existingIds);return chats.filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return true;});}
