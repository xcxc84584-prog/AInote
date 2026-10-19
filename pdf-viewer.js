/* BV-Note PDF Viewer: isolated, read-only, no Markdown processing. */
(()=>{
 const main=document.querySelector('.workspace main');
 const frame=document.createElement('iframe');
 frame.id='bv-pdf-viewer';frame.title='PDF 唯讀瀏覽器';
 frame.setAttribute('aria-label','PDF 唯讀瀏覽器');
 frame.style.cssText='display:none;width:100%;height:calc(100vh - 190px);min-height:400px;border:0;background:#252a33';
 main.append(frame);
 let url=null;let generation=0;
 function hide(){generation++;frame.style.display='none';frame.removeAttribute('src');if(url){URL.revokeObjectURL(url);url=null}}
 async function show(file){hide();if(!file||!(/\.pdf$/i.test(file.name)||file.type==='application/pdf'))throw Error('不是 PDF 文件');const n=generation;url=URL.createObjectURL(file);if(n!==generation)return;frame.src=url+'#toolbar=1&navpanes=0';frame.style.display='block'}
 window.BVPdfViewer={show,hide,get active(){return frame.style.display!=='none'}};
})();
