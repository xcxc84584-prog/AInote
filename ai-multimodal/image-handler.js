// S9: Opt-in browser image input; never transmit without explicit confirmation.
const allowed=new Map([['image/png',[0x89,0x50,0x4e,0x47]],['image/jpeg',[0xff,0xd8,0xff]],['image/webp',[0x52,0x49,0x46,0x46]]]);
export async function validateImage(file){
 if(!(file instanceof Blob)||!allowed.has(file.type)||file.size<16||file.size>5*1024*1024)throw Error('AI-S9-415 unsupported image or size');
 const head=new Uint8Array(await file.slice(0,12).arrayBuffer());if(!allowed.get(file.type).every((b,i)=>head[i]===b))throw Error('AI-S9-422 MIME/signature mismatch');
 if(file.type==='image/webp'&&String.fromCharCode(...head.slice(8,12))!=='WEBP')throw Error('AI-S9-422 invalid WEBP');
 return {mime:file.type,bytes:file.size};
}
export async function imageDataURL(file){await validateImage(file);return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('AI-S9-500 read failed'));r.readAsDataURL(file)})}
export function imageInput(dataUrl){if(typeof dataUrl!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)||dataUrl.length>7.2e6)throw Error('AI-S9-400 invalid image');return {type:'input_image',image_url:dataUrl};}
