// S3/S4 opt-in sidecar UI. Existing chat list and storage are untouched.
import {parseChatFile,catalogOf,uniqueImports} from './conversation-import.js';
import {saveImportedChats,loadImportCatalog,loadImportedMessages} from './import-store.js';
import {stageBlob,loadStaged,clearStaged} from '../ai-transfer/queue.js';
import {reconstructBlob,verifyManifest} from '../ai-transfer/transport.js';
const host=document.getElementById('ai-chat-page');
if(host){
 const button=document.createElement('button');button.type='button';button.textContent='Import / Transfer (S3–S4)';button.title='Independent local import and chunk staging; does not modify existing chats';
 const panel=document.createElement('dialog');panel.style.cssText='max-width:780px;width:92%;max-height:85vh;overflow:auto;background:#15191e;color:#eee;border:1px solid #777;border-radius:10px;padding:18px';
 const title=document.createElement('h3');title.textContent='AI Import & Local Transfer (Preview)';
 const file=document.createElement('input');file.type='file';file.accept='.zip,.json,.md,.markdown,.txt';
 const stage=document.createElement('button');stage.type='button';stage.textContent='Stage 5 MiB local chunks';
 const parse=document.createElement('button');parse.type='button';parse.textContent='Import conversations locally';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Show catalog';
 const close=document.createElement('button');close.type='button';close.textContent='Close';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='No files are uploaded to server. This is an isolated preview.';
 const list=document.createElement('div');list.style.cssText='max-height:300px;overflow:auto';
 const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:12px 0';row.append(stage,parse,refresh,close);
 panel.append(title,file,row,status,list);host.append(panel);
 const toolbar=document.querySelector('#ai-explorer .ai-explorer-actions');toolbar?.append(button);
 button.onclick=()=>{panel.showModal();refresh.click();};close.onclick=()=>panel.close();
 function showError(e){status.textContent='Error: '+(e?.message||String(e));}
 refresh.onclick=async()=>{try{const catalog=await loadImportCatalog();list.replaceChildren();for(const c of catalog){const b=document.createElement('button');b.type='button';b.style.cssText='display:block;width:100%;text-align:left;margin:3px 0';b.textContent=`${c.title} (${c.messageCount} messages)`;b.onclick=async()=>{const messages=await loadImportedMessages(c.id);list.replaceChildren();const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;max-height:50vh;overflow:auto';pre.textContent=messages.map(m=>`${m.role}: ${m.text}`).join('\n\n---\n\n').slice(0,200000);list.append(pre);};list.append(b);}status.textContent=`${catalog.length} locally imported chats (catalog only).`; }catch(e){showError(e);}};
 parse.onclick=async()=>{if(!file.files[0])return;try{status.textContent='Parsing...';const chats=await parseChatFile(file.files[0]);const old=await loadImportCatalog();const fresh=uniqueImports(chats,old.map(x=>x.id));const count=await saveImportedChats(fresh);status.textContent=`Imported ${count}, skipped ${chats.length-count}. No existing AI chats changed.`;refresh.click();}catch(e){showError(e);}};
 stage.onclick=async()=>{if(!file.files[0])return;try{status.textContent='Staging...';const manifest=await stageBlob(file.files[0]);const staged=await loadStaged(manifest.uploadId);const blob=reconstructBlob(staged.parts);await verifyManifest(blob,manifest);status.textContent=`Local stage verified: ${manifest.partCount} parts, ${manifest.size} bytes; ID ${manifest.uploadId}. No network request or quota charge.`;}catch(e){showError(e);}};
}
