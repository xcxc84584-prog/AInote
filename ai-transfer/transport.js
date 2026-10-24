// S4: byte-level 5 MiB chunking. Transport chunks != RAG chunks != chat blocks.
export const PART_BYTES=5*1024*1024;
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export async function sha256(blob){return hex(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()));}
export function planChunks(size){if(!Number.isSafeInteger(size)||size<0)throw RangeError('Invalid size');return Array.from({length:Math.ceil(size/PART_BYTES)},(_,i)=>({index:i,start:i*PART_BYTES,end:Math.min(size,(i+1)*PART_BYTES)}));}
export async function makeManifest(file,{signal,onProgress}={}){
 if(!(file instanceof Blob))throw TypeError('Blob required');
 const parts=[];for(const p of planChunks(file.size)){if(signal?.aborted)throw new DOMException('Aborted','AbortError');const blob=file.slice(p.start,p.end);parts.push({index:p.index,bytes:blob.size,sha256:await sha256(blob)});onProgress?.({done:parts.length,total:Math.ceil(file.size/PART_BYTES)});}
 return {uploadId:crypto.randomUUID(),name:file.name||'blob',size:file.size,partCount:parts.length,parts,createdAt:new Date().toISOString(),state:'local'};
}
export async function verifyManifest(file,manifest,{signal}={}){
 if(file.size!==manifest.size||planChunks(file.size).length!==manifest.partCount)throw Error('TRANSFER-MANIFEST: size/count mismatch');
 for(const p of manifest.parts){if(signal?.aborted)throw new DOMException('Aborted','AbortError');const actual=await sha256(file.slice(p.index*PART_BYTES,Math.min(file.size,(p.index+1)*PART_BYTES)));if(actual!==p.sha256)throw Error('TRANSFER-HASH: part '+p.index);}
 return true;
}
export function reconstructBlob(parts){const ordered=[...parts].sort((a,b)=>a.index-b.index);if(ordered.some((p,i)=>p.index!==i||!(p.blob instanceof Blob)))throw Error('TRANSFER-MISSING: missing or invalid part');return new Blob(ordered.map(p=>p.blob));}
