// AREA A07 START: PDFViewer | File: pdf-viewer.js
/* BV-Note PDF Viewer: isolated, read-only, no Markdown processing. */
(()=>{
 const main=document.querySelector('.workspace main');
 const frame=document.createElement('iframe');
 frame.id='bv-pdf-viewer';frame.title='PDF 唯讀瀏覽器';
 frame.setAttribute('aria-label','PDF 唯讀瀏覽器');
 frame.style.cssText='display:none;width:100%;height:calc(100% - 22px);border:0;background:#252a33';
 const wrap=document.createElement('div');wrap.id='bv-pdf-wrap';wrap.style.cssText='display:none;width:100%;height:600px;min-height:240px;position:relative;flex-direction:column';
 const handle=document.createElement('div');handle.id='bv-pdf-resizer';handle.setAttribute('role','separator');handle.setAttribute('aria-label','拖曳調整 PDF 高度');handle.tabIndex=0;
 try{const saved=Number(localStorage.getItem('bv-pdf-height'));if(saved>=240&&saved<=3000)wrap.style.height=saved+'px'}catch{}
 wrap.append(frame,handle);
 main.append(wrap);
 let dragging=false,startY=0,startH=0;
 handle.addEventListener('pointerdown',e=>{dragging=true;startY=e.clientY;startH=wrap.getBoundingClientRect().height;handle.setPointerCapture(e.pointerId);e.preventDefault()});
 handle.addEventListener('pointermove',e=>{if(!dragging)return;const h=Math.max(240,Math.min(3000,startH+e.clientY-startY));wrap.style.height=h+'px'});
 const finish=()=>{if(dragging){dragging=false;try{localStorage.setItem('bv-pdf-height',String(Math.round(wrap.getBoundingClientRect().height)))}catch{}}};
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const h=Math.max(240,Math.min(3000,wrap.getBoundingClientRect().height+(e.key==='ArrowDown'?40:-40)));wrap.style.height=h+'px';localStorage.setItem('bv-pdf-height',String(h))});
 let url=null;let generation=0;
 function hide(){generation++;frame.style.display='none';wrap.style.display='none';frame.removeAttribute('src');if(url){URL.revokeObjectURL(url);url=null}}
 async function show(file){hide();if(!file||!(/\.pdf$/i.test(file.name)||file.type==='application/pdf'))throw Error('不是 PDF 文件');const n=generation;url=URL.createObjectURL(file);if(n!==generation)return;frame.src=url+'#toolbar=1&navpanes=0';frame.style.display='block';wrap.style.display='flex'}
 window.BVPdfViewer={show,hide,get active(){return frame.style.display!=='none'}};
})();
// AREA A07 END: PDFViewer
