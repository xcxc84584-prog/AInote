'use strict';
// Mermaid source is preserved. Invalid diagrams remain readable, never replaced by an error SVG.
(()=>{
 let sequence=0;
 const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validType=/^\s*(?:sequenceDiagram|flowchart|graph|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|xychart-beta|block-beta|sankey-beta|architecture-beta|packet-beta|kanban|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i;
 function fallback(node,source,error){
  node.replaceChildren();node.classList.add('bv-mermaid-fallback');
  const title=document.createElement('div');title.className='bv-mermaid-error';title.textContent='圖表語法有誤，已保留 Mermaid 原始碼';
  const code=document.createElement('pre');code.textContent=source;
  node.append(title,code);node.dataset.processed='error';
  node.title=String(error?.message||error||'無法解析圖表').slice(0,350);
 }
 window.BVRenderMermaid=async()=>{
  const nodes=[...document.querySelectorAll('#editor .mermaid:not([data-processed])')];
  if(!nodes.length)return;
  for(const node of nodes){
   const source=node.textContent.trim();node.dataset.processed='pending';
   if(!validType.test(source)){fallback(node,source,'未識別 Mermaid 圖表類型');continue;}
   if(!window.mermaid){fallback(node,source,'Mermaid 函式庫無法載入');continue;}
   try{
    window.mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'dark',suppressErrorRendering:true});
    // Validate before rendering. Mermaid 11 may otherwise insert a full-page syntax-error SVG.
    const parsed=await window.mermaid.parse(source,{suppressErrors:true});
    if(!parsed)throw Error('Mermaid 語法檢查未通過');
    const id='bvmermaid'+(++sequence);
    const result=await window.mermaid.render(id,source);
    if(!node.isConnected)continue;
    if(!result?.svg||/Syntax error in text/i.test(result.svg))throw Error('Mermaid 回傳語法錯誤圖');
    node.innerHTML=result.svg;node.dataset.processed='true';
   }catch(e){if(node.isConnected)fallback(node,source,e);}
  }
 };
 window.addEventListener('load',()=>window.BVRenderMermaid());
})();
