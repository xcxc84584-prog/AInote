// sEAPP S6: bounded, explicit Responses API request builder. No silent truncation.
export const ALLOWED_MODELS=Object.freeze(['gpt-5','gpt-4.1','gpt-4.1-mini']);
export function buildAIRequest({model='gpt-5',messages,maxOutputTokens=2048,stream=false}={}){
 if(!ALLOWED_MODELS.includes(model))throw Error('AI-S6-MODEL: unsupported model');
 if(!Array.isArray(messages)||!messages.length||messages.length>30)throw Error('AI-S6-MESSAGES: 1..30 messages required');
 if(!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<256||maxOutputTokens>8192)throw Error('AI-S6-TOKENS: output budget must be 256..8192');
 let chars=0;
 const input=messages.map((m,i)=>{
  if(!m||!['user','assistant','developer'].includes(m.role)||typeof m.text!=='string'||!m.text.trim())throw Error('AI-S6-ROLE: invalid message '+i);
  chars+=m.text.length;
  if(m.text.length>30000||chars>60000)throw Error('AI-S6-CONTEXT: input exceeds explicit budget');
  return {role:m.role,content:[{type:'input_text',text:m.text}]};
 });
 return {model,input,max_output_tokens:maxOutputTokens,stream:!!stream,store:false};
}
