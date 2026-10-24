// BV-Note v3.9.12.2 - deterministic SSE parsing and explicit lifecycle.
export class SSEParser {
 constructor(onEvent){this.onEvent=onEvent;this.decoder=new TextDecoder();this.pending='';this.maxPending=1024*1024;}
 push(bytes){this.pending+=this.decoder.decode(bytes,{stream:true});this.drain(false)}
 finish(){this.pending+=this.decoder.decode();this.drain(true)}
 drain(final){
  this.pending=this.pending.replace(/\r\n|\r/g,'\n');let i;
  const emit=raw=>{let event='message',id='',data=[];for(const line of raw.split('\n')){
   if(line.startsWith('event:'))event=line.slice(6).trim();
   else if(line.startsWith('id:'))id=line.slice(3).trim();
   else if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
  }if(data.length)this.onEvent({event,id,data:data.join('\n')})};
  while((i=this.pending.indexOf('\n\n'))>=0){const raw=this.pending.slice(0,i);this.pending=this.pending.slice(i+2);emit(raw)}
  if(final&&this.pending.trim()){emit(this.pending);this.pending=''}
  if(this.pending.length>this.maxPending)throw Error('AI-S7-SSE-OVERFLOW');
 }
}
export class StreamState {
 constructor(){this.status='idle';this.text='';this.error=null;this.finishReason=null;}
 start(){this.status='generating';this.text='';this.error=null;this.finishReason=null}
 delta(t){if(this.status==='generating')this.text+=t}
 complete(reason='response.completed'){if(this.status==='generating'){this.status='completed';this.finishReason=reason}}
 stop(){if(this.status==='generating'){this.status='stopped';this.finishReason='user-abort'}}
 fail(e){if(this.status==='generating'){this.status='failed';this.error=String(e).slice(0,300)}}
}
export async function consumeAIStream(response,{onDelta=()=>{},onState=()=>{},signal}={}){
 if(!response.ok)throw Error('AI-S7-HTTP-'+response.status);
 const state=new StreamState();state.start();onState(state);
 const reader=response.body?.getReader();if(!reader)throw Error('AI-S7-NO-BODY');
 let sawCompleted=false,sawDone=false,sawEOF=false;
 const parser=new SSEParser(({event,data})=>{
  if(data==='[DONE]'){sawDone=true;return}
  let item;try{item=JSON.parse(data)}catch{return}
  const type=item.type||event;
  if(type==='response.output_text.delta'&&typeof item.delta==='string'){
   state.delta(item.delta);onDelta(item.delta,state);
  }else if(type==='response.completed'){sawCompleted=true;state.complete();onState(state)}
  else if(type==='response.incomplete')state.fail('AI-S7-INCOMPLETE '+JSON.stringify(item.response?.incomplete_details||{}));
  else if(type==='response.failed'||type==='error')state.fail(item.error?.message||item.response?.error?.message||'upstream failed');
 });
 try{
  while(true){
   if(signal?.aborted){state.stop();break}
   const {done,value}=await reader.read();if(done){sawEOF=true;break}
   parser.push(value);
   if(state.status==='failed')break;
   // Do not cancel on response.completed: the final [DONE] may follow.
  }
  if(sawEOF)parser.finish();
  if(state.status==='generating'){
   if(signal?.aborted)state.stop();
   else if(sawCompleted)state.complete();
   else state.fail('AI-S7-INTERRUPTED: EOF before response.completed');
  }
 }catch(e){if(signal?.aborted)state.stop();else state.fail(e?.message||String(e))}
 finally{
  if(!sawEOF)await reader.cancel().catch(()=>{});
  onState(state);
 }
 state.sawDone=sawDone;return state;
}
