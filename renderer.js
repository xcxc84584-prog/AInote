/* AREA A-99D75600 START: renderer.js */
// AREA A03 START: MarkdownRenderer | File: renderer.js
'use strict';
// Offline Markdown renderer. Keeps raw SVG blocks and images as elements.
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inline=s=>{/* BLOCK B-29BC12BA22 START: AREA A-99D75600 */
 let placeholders=[];const hold=x=>{/* BLOCK B-A916E1B853 START: AREA A-99D75600 */let i=placeholders.push(x)-1;return `@@AIRENDER${i}@@`/* BLOCK B-A916E1B853 END. */};
 s=s.replace(/!\[([^\]]*)\]\((data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s)]+)\)/g,(_,a,u)=>hold(`<img alt="${esc(a)}" src="${esc(u)}">`));
 s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,a,u)=>/^https?:\/\//.test(u)?hold(`<img alt="${esc(a)}" src="${esc(u)}">`):`![${a}](${u})`);
 s=s.replace(/(`[^`\n]+`)/g,x=>hold(`<code>${esc(x.slice(1,-1))}</code>`));
 s=s.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g,x=>hold(`<span class="math-source" data-tex="${esc(x)}">${esc(x)}</span>`));
 s=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/~~(.+?)~~/g,'<del>$1</del>');
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>');
 return s.replace(/@@AIRENDER(\d+)@@/g,(_,i)=>placeholders[+i]);
/* BLOCK B-29BC12BA22 END. */};
function markdownToHTML(source){/* BLOCK B-59B737A186 START: AREA A-99D75600 */
 const lines=source.replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0;
 const row=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
 while(i<lines.length){let line=lines[i],t=line.trim();
 if(!t){i++;continue}
 if(/^<svg(?:\s|>)/i.test(t) && /<\/svg\s*>/i.test(t)){out.push(`<div class="svg-block">${line}</div>`);i++;continue}
 if(/^<svg(?:\s|>)/i.test(t)){
  let parts=[],depth=0;do{let l=lines[i++];parts.push(l);depth+=(l.match(/<svg(?:\s|>)/gi)||[]).length-(l.match(/<\/svg\s*>/gi)||[]).length}while(i<lines.length&&depth>0);
  out.push(`<div class="svg-block">${parts.join('\n')}</div>`);continue;
 }
 if(/^```/.test(t)){let lang=t.slice(3).trim(),code=[];i++;while(i<lines.length&&!/^```/.test(lines[i].trim()))code.push(lines[i++]);i++;out.push(`<pre><code data-language="${esc(lang)}">${esc(code.join('\n'))}</code></pre>`);continue}
 if(t==='$$'||t==='\\['){const close=t==='$$'?'$$':'\\]';let math=[];i++;while(i<lines.length&&lines[i].trim()!==close)math.push(lines[i++]);i++;out.push(`<div class="math-source" data-tex="${esc(t+'\n'+math.join('\n')+'\n'+close)}">${esc(math.join('\n'))}</div>`);continue}
 if(/^\|?.+\|.+\|?$/.test(t)&&i+1<lines.length&&/^\|?[\s:|-]+\|[\s:|-]+\|?$/.test(lines[i+1].trim())&&lines[i+1].includes('-')){
  const headers=row(line);i+=2;let body=[];
  while(i<lines.length&&lines[i].trim().includes('|')&&lines[i].trim()){body.push(row(lines[i++]));}
  out.push('<table><thead><tr>'+headers.map(c=>`<th>${inline(c)}</th>`).join('')+'</tr></thead><tbody>'+body.map(r=>'<tr>'+headers.map((_,j)=>`<td>${inline(r[j]||'')}</td>`).join('')+'</tr>').join('')+'</tbody></table>');continue;
 }
 let heading=t.match(/^(#{1,6})\s+(.+)$/);if(heading){let n=heading[1].length;out.push(`<h${n}>${inline(heading[2])}</h${n}>`);i++;continue}
 if(/^(-{3,}|\*{3,}|_{3,})$/.test(t)){out.push('<hr>');i++;continue}
 if(/^>\s?/.test(t)){let a=[];while(i<lines.length&&/^>\s?/.test(lines[i].trim()))a.push(lines[i++].trim().replace(/^>\s?/,''));out.push(`<blockquote>${a.map(inline).join('<br>')}</blockquote>`);continue}
 if(/^\s*(?:[-*+] |\d+\. )/.test(line)){const ordered=/^\s*\d+\. /.test(line),items=[];while(i<lines.length&&/^\s*(?:[-*+] |\d+\. )/.test(lines[i]))items.push(lines[i++].replace(/^\s*(?:[-*+] |\d+\. )/,''));out.push(`<${ordered?'ol':'ul'}>`+items.map(x=>`<li>${inline(x)}</li>`).join('')+`</${ordered?'ol':'ul'}>`);continue}
 let para=[];while(i<lines.length&&lines[i].trim()&&!/^\s*(?:#{1,6} |```|<svg(?:\s|>)|\|.+\||> |[-*+] |\d+\. )/.test(lines[i]))para.push(lines[i++]);
 if(!para.length)para.push(lines[i++]);out.push(`<p>${inline(para.join(' '))}</p>`);
 }
 return out.join('\n');
/* BLOCK B-59B737A186 END. */}
function texToMathML(tex){/* BLOCK B-B9F2D948A0 START: AREA A-99D75600 */
 const greek={alpha:'α',beta:'β',gamma:'γ',delta:'δ',theta:'θ',lambda:'λ',pi:'π',sigma:'σ',omega:'ω',pm:'±',times:'×',cdot:'·',leq:'≤',geq:'≥',infty:'∞',int:'∫',sum:'∑'};
 let i=0;function group(){/* BLOCK B-A1B7DC8E3A START: AREA A-99D75600 */if(tex[i]==='{'){i++;let s=parse('}');i++;return s}return atom()/* BLOCK B-A1B7DC8E3A END. */}
 function atom(){/* BLOCK B-69A043610C START: AREA A-99D75600 */if(i>=tex.length)return '';let c=tex[i++];if(c==='\\'){let m=tex.slice(i).match(/^[a-zA-Z]+/);if(m){let cmd=m[0];i+=cmd.length;if(cmd==='frac'){let a=group(),b=group();return `<mfrac>${wrap(a)}${wrap(b)}</mfrac>`}if(cmd==='sqrt')return `<msqrt>${group()}</msqrt>`;if(cmd==='boxed')return `<menclose notation="box">${group()}</menclose>`;if(cmd==='text'||cmd==='mathrm')return `<mtext>${esc(strip(group()))}</mtext>`;if(cmd==='left'||cmd==='right')return '';return `<mi>${greek[cmd]||esc(cmd)}</mi>`}return `<mo>${esc(tex[i++]||'')}</mo>`}if(c==='{'){let r=parse('}');i++;return r}if(/[0-9]/.test(c))return `<mn>${c}</mn>`;if(/[a-zA-Z]/.test(c))return `<mi>${c}</mi>`;if(/\s/.test(c))return '<mspace width="0.15em"/>';return `<mo>${esc(c)}</mo>`/* BLOCK B-69A043610C END. */}
 function strip(s){/* BLOCK B-92B83AA39A START: AREA A-99D75600 */return s.replace(/<[^>]+>/g,'')/* BLOCK B-92B83AA39A END. */};function wrap(s){/* BLOCK B-DEFCE947D2 START: AREA A-99D75600 */return `<mrow>${s}</mrow>`/* BLOCK B-DEFCE947D2 END. */}
 function parse(end){/* BLOCK B-6470427D42 START: AREA A-99D75600 */let result='';while(i<tex.length&&tex[i]!==end){let a=atom();while(tex[i]==='^'||tex[i]==='_'){let op=tex[i++],b=group();a=op==='^'?`<msup>${wrap(a)}${wrap(b)}</msup>`:`<msub>${wrap(a)}${wrap(b)}</msub>`}result+=a}return result/* BLOCK B-6470427D42 END. */}
 return `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>${parse()}</mrow></math>`;
/* BLOCK B-B9F2D948A0 END. */}
function renderMathElements(root){/* BLOCK B-662E815686 START: AREA A-99D75600 */root.querySelectorAll('.math-source').forEach(el=>{/* BLOCK B-B5CD205FBB START: AREA A-99D75600 */
 const raw=el.dataset.tex||el.textContent;let display=raw.startsWith('$$')||raw.startsWith('\\[');let tex=raw.trim();if(display&&tex.startsWith('\\[')&&tex.endsWith('\\]'))tex=tex.slice(2,-2).trim();else if(display&&tex.startsWith('$$')&&tex.endsWith('$$'))tex=tex.slice(2,-2).trim();else if(tex.startsWith('\\(')&&tex.endsWith('\\)'))tex=tex.slice(2,-2).trim();else if(tex.startsWith('$')&&tex.endsWith('$'))tex=tex.slice(1,-1).trim();
 const wrap=document.createElement(display?'div':'span');wrap.className='math-rendered';wrap.dataset.latex=raw;
 try{if(window.katex)katex.render(tex,wrap,{displayMode:display,throwOnError:false,trust:false});else wrap.innerHTML=texToMathML(tex)}catch(e){wrap.textContent=raw}
 el.replaceWith(wrap);
 /* BLOCK B-B5CD205FBB END. */})/* BLOCK B-662E815686 END. */}

// Decode SVG data URIs without changing the stored Markdown source.
function svgDataImages(source){/* BLOCK B-16A9388A15 START: AREA A-99D75600 */
 const saved=[];
 const output=source.replace(/!\[([^\]\n]*)\]\(\s*(data:image\/svg\+xml(?:;charset=[^;,\s)]+)?(?:;base64)?,[^\s)]*)\s*\)/gi,(whole,alt,url)=>{/* BLOCK B-4DD30D8A7C START: AREA A-99D75600 */
  try{
   const comma=url.indexOf(',');const header=url.slice(0,comma);const payload=url.slice(comma+1);
   let xml;
   if(/;base64/i.test(header)){
    const binary=atob(payload);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));xml=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   }else xml=decodeURIComponent(payload);
   const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
   if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')return whole;
   const svg=doc.documentElement;
   svg.querySelectorAll('script,foreignObject,iframe,object,embed,style').forEach(el=>el.remove());
   svg.querySelectorAll('*').forEach(el=>{/* BLOCK B-452F9CD4A1 START: AREA A-99D75600 */for(const a of [...el.attributes]){
    if(/^on/i.test(a.name)||a.name==='style'||(/^(?:href|xlink:href)$/i.test(a.name)&&!/^#/.test(a.value)))el.removeAttribute(a.name);
   }/* BLOCK B-452F9CD4A1 END. */});
   const markup=new XMLSerializer().serializeToString(svg);
   const id=saved.push('<div class="svg-block" role="img" aria-label="'+esc(alt)+'">'+markup+'</div>')-1;
   return '\n\nAIPROTECTEDSVG'+id+'END\n\n';
  }catch(e){return whole}
 /* BLOCK B-4DD30D8A7C END. */});
 return {output,saved};
/* BLOCK B-16A9388A15 END. */}
function parseDocument(source){/* BLOCK B-7F73891728 START: AREA A-99D75600 */
 source=String(source).replace(/\r\n?/g,'\n');
 const svgImages=svgDataImages(source);source=svgImages.output;
 const mermaidBlocks=[];
 source=source.replace(/(^|\n)[ \t]*```[ \t]*mermaid[ \t]*\n([\s\S]*?)\n[ \t]*```[ \t]*(?=\n|$)/gi,(_,lead,diagram)=>{/* BLOCK B-6D5E239E71 START: AREA A-99D75600 */const id=mermaidBlocks.push(diagram)-1;return lead+'\n\nAIMERMAID'+id+'END\n\n'/* BLOCK B-6D5E239E71 END. */});
 const tokens=[];
 // Protect display math and SVG from any other Markdown transformations.
 // Protect both TeX display delimiters before marked processes backslash escapes.
 // Also protect inline \( ... \) delimiters, which marked otherwise unescapes.
 // Protect math before Markdown parsing, including multiline $$ and \[ blocks.
 // A standalone delimiter must match another standalone delimiter.
 const protectMath=(all,display)=>{/* BLOCK B-0D6DAFF0A5 START: AREA A-99D75600 */
  const tex=all.slice(2,-2).trim();
  const tag=display?'div':'span';
  const id=tokens.push(`<${tag} class="math-source" data-tex="${esc(all)}">${esc(tex)}</${tag}>`)-1;
  return display?`\n\nAIPROTECTED${id}END\n\n`:`AIPROTECTED${id}END`;
 /* BLOCK B-0D6DAFF0A5 END. */};
 // First process entire display blocks; prevent Markdown from stripping \ commands.
 source=source.replace(/(^|\n)[ \t]*\$\$[ \t]*\n([\s\S]*?)\n[ \t]*\$\$[ \t]*(?=\n|$)/g,(_,lead,body)=>lead+protectMath('$$'+body+'$$',true));
 source=source.replace(/(^|\n)[ \t]*\\\[[ \t]*\n([\s\S]*?)\n[ \t]*\\\][ \t]*(?=\n|$)/g,(_,lead,body)=>lead+protectMath('\\['+body+'\\]',true));
 // Also support delimiters and content on the same line.
 source=source.replace(/\$\$[^\n]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g,all=>protectMath(all,all.startsWith('$$')||all.startsWith('\\[')));
 source=source.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,all=>{/* BLOCK B-D14E16EEA2 START: AREA A-99D75600 */
  const id=tokens.push(`<div class="svg-block">${all}</div>`)-1;
  return `\n\nAIPROTECTED${id}END\n\n`;
 /* BLOCK B-D14E16EEA2 END. */});
 let html=window.marked?marked.parse(source,{gfm:true,breaks:false}):markdownToHTML(source);
 html=html.replace(/(?:<p>\s*)?AIPROTECTEDSVG(\d+)END(?:\s*<\/p>)?/g,(_,n)=>svgImages.saved[+n]);
 html=html.replace(/(?:<p>\s*)?AIMERMAID(\d+)END(?:\s*<\/p>)?/g,(_,n)=>'<div class="mermaid">'+esc(mermaidBlocks[+n])+'</div>');
 html=html.replace(/(?:<p>\s*)?AIPROTECTED(\d+)END(?:\s*<\/p>)?/g,(_,n)=>tokens[+n]);
 return html;
/* BLOCK B-7F73891728 END. */}
// AREA A03 END: MarkdownRenderer

/* AREA A-99D75600 END. */
