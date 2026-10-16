'use strict';
// Offline Markdown renderer. Keeps raw SVG blocks and images as elements.
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inline=s=>{
 let placeholders=[];const hold=x=>{let i=placeholders.push(x)-1;return `@@AIRENDER${i}@@`};
 s=s.replace(/!\[([^\]]*)\]\((data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s)]+)\)/g,(_,a,u)=>hold(`<img alt="${esc(a)}" src="${esc(u)}">`));
 s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,a,u)=>/^https?:\/\//.test(u)?hold(`<img alt="${esc(a)}" src="${esc(u)}">`):`![${a}](${u})`);
 s=s.replace(/(`[^`\n]+`)/g,x=>hold(`<code>${esc(x.slice(1,-1))}</code>`));
 s=s.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g,x=>hold(`<span class="math-source" data-tex="${esc(x)}">${esc(x)}</span>`));
 s=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/~~(.+?)~~/g,'<del>$1</del>');
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>');
 return s.replace(/@@AIRENDER(\d+)@@/g,(_,i)=>placeholders[+i]);
};
function markdownToHTML(source){
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
}
function texToMathML(tex){
 const greek={alpha:'α',beta:'β',gamma:'γ',delta:'δ',theta:'θ',lambda:'λ',pi:'π',sigma:'σ',omega:'ω',pm:'±',times:'×',cdot:'·',leq:'≤',geq:'≥',infty:'∞',int:'∫',sum:'∑'};
 let i=0;function group(){if(tex[i]==='{'){i++;let s=parse('}');i++;return s}return atom()}
 function atom(){if(i>=tex.length)return '';let c=tex[i++];if(c==='\\'){let m=tex.slice(i).match(/^[a-zA-Z]+/);if(m){let cmd=m[0];i+=cmd.length;if(cmd==='frac'){let a=group(),b=group();return `<mfrac>${wrap(a)}${wrap(b)}</mfrac>`}if(cmd==='sqrt')return `<msqrt>${group()}</msqrt>`;if(cmd==='boxed')return `<menclose notation="box">${group()}</menclose>`;if(cmd==='text'||cmd==='mathrm')return `<mtext>${esc(strip(group()))}</mtext>`;if(cmd==='left'||cmd==='right')return '';return `<mi>${greek[cmd]||esc(cmd)}</mi>`}return `<mo>${esc(tex[i++]||'')}</mo>`}if(c==='{'){let r=parse('}');i++;return r}if(/[0-9]/.test(c))return `<mn>${c}</mn>`;if(/[a-zA-Z]/.test(c))return `<mi>${c}</mi>`;if(/\s/.test(c))return '<mspace width="0.15em"/>';return `<mo>${esc(c)}</mo>`}
 function strip(s){return s.replace(/<[^>]+>/g,'')};function wrap(s){return `<mrow>${s}</mrow>`}
 function parse(end){let result='';while(i<tex.length&&tex[i]!==end){let a=atom();while(tex[i]==='^'||tex[i]==='_'){let op=tex[i++],b=group();a=op==='^'?`<msup>${wrap(a)}${wrap(b)}</msup>`:`<msub>${wrap(a)}${wrap(b)}</msub>`}result+=a}return result}
 return `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>${parse()}</mrow></math>`;
}
function renderMathElements(root){root.querySelectorAll('.math-source').forEach(el=>{
 const raw=el.dataset.tex||el.textContent;let display=raw.startsWith('$$')||raw.startsWith('\\[');let tex=raw.trim();if(display&&tex.startsWith('\\[')&&tex.endsWith('\\]'))tex=tex.slice(2,-2).trim();else if(display&&tex.startsWith('$$')&&tex.endsWith('$$'))tex=tex.slice(2,-2).trim();else if(tex.startsWith('\\(')&&tex.endsWith('\\)'))tex=tex.slice(2,-2).trim();else if(tex.startsWith('$')&&tex.endsWith('$'))tex=tex.slice(1,-1).trim();
 const wrap=document.createElement(display?'div':'span');wrap.className='math-rendered';wrap.dataset.latex=raw;
 try{if(window.katex)katex.render(tex,wrap,{displayMode:display,throwOnError:false,trust:false});else wrap.innerHTML=texToMathML(tex)}catch(e){wrap.textContent=raw}
 el.replaceWith(wrap);
 })}

// Decode SVG data URIs without changing the stored Markdown source.
function svgDataImages(source){
 const saved=[];
 const output=source.replace(/!\[([^\]\n]*)\]\(\s*(data:image\/svg\+xml(?:;charset=[^;,\s)]+)?(?:;base64)?,[^\s)]*)\s*\)/gi,(whole,alt,url)=>{
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
   svg.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]){
    if(/^on/i.test(a.name)||a.name==='style'||(/^(?:href|xlink:href)$/i.test(a.name)&&!/^#/.test(a.value)))el.removeAttribute(a.name);
   }});
   const markup=new XMLSerializer().serializeToString(svg);
   const id=saved.push('<div class="svg-block" role="img" aria-label="'+esc(alt)+'">'+markup+'</div>')-1;
   return '\n\nAIPROTECTEDSVG'+id+'END\n\n';
  }catch(e){return whole}
 });
 return {output,saved};
}
function parseDocument(source){
 source=String(source).replace(/\r\n?/g,'\n');
 const svgImages=svgDataImages(source);source=svgImages.output;
 const tokens=[];
 // Protect display math and SVG from any other Markdown transformations.
 source=source.replace(/\$\$([\s\S]*?)\$\$/g,(all,tex)=>{
  const id=tokens.push(`<div class="math-source" data-tex="${esc(all)}">${esc(tex)}</div>`)-1;
  return `\n\nAIPROTECTED${id}END\n\n`;
 });
 source=source.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,all=>{
  const id=tokens.push(`<div class="svg-block">${all}</div>`)-1;
  return `\n\nAIPROTECTED${id}END\n\n`;
 });
 let html=window.marked?marked.parse(source,{gfm:true,breaks:false}):markdownToHTML(source);
 html=html.replace(/(?:<p>\s*)?AIPROTECTEDSVG(\d+)END(?:\s*<\/p>)?/g,(_,n)=>svgImages.saved[+n]);
 html=html.replace(/(?:<p>\s*)?AIPROTECTED(\d+)END(?:\s*<\/p>)?/g,(_,n)=>tokens[+n]);
 return html;
}
