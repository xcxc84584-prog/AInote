// sEAPP S7: UTF-8 safe SSE framing, split events and multiline data.
export class SSEParser {
 constructor(onEvent){this.onEvent=onEvent;this.decoder=new TextDecoder();this.pending='';this.maxPending=1024*1024;}
 push(bytes){this.pending+=this.decoder.decode(bytes,{stream:true});this.drain();}
 finish(){this.pending+=this.decoder.decode();this.drain();}
 drain(){this.pending=this.pending.replace(/\r\n/g,'\n');let i;
  while((i=this.pending.indexOf('\n\n'))>=0){const raw=this.pending.slice(0,i);this.pending=this.pending.slice(i+2);let event='message',id='',data=[];
   for(const line of raw.split('\n')){if(line.startsWith('event:'))event=line.slice(6).trim();else if(line.startsWith('id:'))id=line.slice(3).trim();else if(line.startsWith('data:'))data.push(line.slice(5).trimStart());}
   if(data.length)this.onEvent({event,id,data:data.join('\n')});
  }
  if(this.pending.length>this.maxPending)throw Error('AI-S7-SSE-OVERFLOW');
 }
}
export class StreamState {
 constructor(){this.status='idle';this.text='';this.error=null;}
 start(){if(!['idle','stopped','failed','completed'].includes(this.status))throw Error('AI-S7-STATE');this.status='generating';this.text='';this.error=null;}
 delta(t){if(this.status==='generating')this.text+=t;}
 complete(){if(this.status==='generating')this.status='completed';}
 stop(){if(this.status==='generating')this.status='stopped';}
 fail(e){if(this.status==='generating'){this.status='failed';this.error=String(e).slice(0,200);}}
}
export async function consumeAIStream(response,{onDelta=()=>{},onState=()=>{},signal}={}){
 if(!response.ok)throw Error('AI-S7-HTTP-'+response.status);
 const state=new StreamState();state.start();onState(state);
 const reader=response.body?.getReader();if(!reader)throw Error('AI-S7-NO-BODY');
 const parser=new SSEParser(({event,data})=>{
  if(data==='[DONE]'){state.complete();onState(state);return;}
  let item;try{item=JSON.parse(data)}catch{return;}
  const type=item.type||event;
  if(type==='response.output_text.delta'&&typeof item.delta==='string'){state.delta(item.delta);onDelta(item.delta,state);}
  else if(type==='response.completed'){state.complete();onState(state);}
  else if(type==='response.failed'||type==='error'){state.fail(item.error?.message||'upstream failed');onState(state);}
 });
 try{while(state.status==='generating'){if(signal?.aborted){state.stop();break;}const {done,value}=await reader.read();if(done)break;parser.push(value);}parser.finish();if(state.status==='generating')state.fail('AI-S7-INTERRUPTED');}
 catch(e){if(signal?.aborted)state.stop();else state.fail(e.message);}
 finally{await reader.cancel().catch(()=>{});onState(state);}return state;
}
