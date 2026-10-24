// S10: Conservative local text extraction. Unsupported formats fail explicitly.
export function safeArchivePath(name){return typeof name==='string'&&name.length>0&&name.length<=240&&!name.startsWith('/')&&!name.includes('\\')&&!/^[a-z]:/i.test(name)&&!name.split('/').some(x=>x==='..'||x==='.'||!x)&&!name.includes('\0');}
export function budgetText(text,max=16000){if(typeof text!=='string'||!Number.isSafeInteger(max)||max<1||max>60000)throw Error('AI-S10-400 invalid budget');const parts=[];for(let i=0;i<text.length;i+=max)parts.push({offset:i,text:text.slice(i,i+max)});return parts;}
export async function parseDocument(file,{signal,maxBytes=10*1024*1024}={}){
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');if(!(file instanceof Blob)||file.size>maxBytes)throw Error('AI-S10-413 file too large');
 const name=String(file.name||'unnamed'),ext=name.split('.').pop().toLowerCase();
 if(['txt','md','csv','json','xml','html','css','js','ts','py','java','c','cpp','h','sql','log'].includes(ext)){const text=await file.text();if(signal?.aborted)throw new DOMException('Aborted','AbortError');return {name,format:ext,text,segments:budgetText(text)}}
 if(!['docx','pptx','xlsx','zip'].includes(ext))throw Error('AI-S10-415 format requires a dedicated parser (PDF/DOC/legacy Office)');
 if(typeof JSZip==='undefined')throw Error('AI-S10-503 JSZip not available');const zip=await JSZip.loadAsync(file,{checkCRC32:true});const entries=Object.values(zip.files);if(entries.length>250)throw Error('AI-S10-413 archive entry limit');
 let total=0;const collected=[];for(const entry of entries){if(signal?.aborted)throw new DOMException('Aborted','AbortError');if(!safeArchivePath(entry.name))throw Error('AI-S10-422 unsafe archive path');if(entry.dir)continue;const rawSize=entry._data?.uncompressedSize;if(typeof rawSize==='number'){total+=rawSize;if(total>20*1024*1024)throw Error('AI-S10-413 expanded archive too large')}
 const path=entry.name;let include=false;if(ext==='docx')include=/^word\/(document|header\d+|footer\d+)\.xml$/.test(path);else if(ext==='pptx')include=/^ppt\/slides\/slide\d+\.xml$/.test(path);else if(ext==='xlsx')include=/^xl\/(sharedStrings|worksheets\/sheet\d+)\.xml$/.test(path);else include=/\.(txt|md|csv|json|xml|html|css|js|py)$/i.test(path);
 if(!include)continue;const text=await entry.async('string');if(text.length>2*1024*1024)throw Error('AI-S10-413 entry too large');collected.push({source:path,text:ext==='zip'?text:extractXMLText(text)});
 }
 if(!collected.length)throw Error('AI-S10-422 no supported textual content');const text=collected.map(x=>`[${x.source}]\n${x.text}`).join('\n\n');return {name,format:ext,text,segments:budgetText(text),sources:collected.map(x=>x.source)};
}
function extractXMLText(xml){if(typeof DOMParser==='undefined')throw Error('AI-S10-503 XML parser unavailable');const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('AI-S10-422 malformed XML');return Array.from(doc.getElementsByTagName('*')).filter(n=>['t','v'].includes(n.localName)&&n.children.length===0).map(n=>n.textContent).join(' ')}
