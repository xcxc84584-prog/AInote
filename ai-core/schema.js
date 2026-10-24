/* BV-Note AI Refactor S2: data contracts; no legacy mutation */
(function(root){'use strict';
 const types=Object.freeze(['conversation','message','attachment','transport_chunk','retrieval_chunk']);
 const validId=v=>typeof v==='string'&&v.length>0&&v.length<=128;
 function validate(type,obj){
   if(!types.includes(type))return {ok:false,error:'UNKNOWN_TYPE'};
   if(!obj||typeof obj!=='object'||Array.isArray(obj)||!validId(obj.id))return {ok:false,error:'INVALID_ID'};
   if(type==='message'&&(!validId(obj.conversationId)||!['user','assistant','system','tool'].includes(obj.role)))return {ok:false,error:'INVALID_MESSAGE'};
   if(type==='transport_chunk'&&(!validId(obj.uploadId)||!Number.isSafeInteger(obj.partIndex)||obj.partIndex<0||!Number.isSafeInteger(obj.partCount)||obj.partCount<1||obj.partIndex>=obj.partCount||!Number.isSafeInteger(obj.bytes)||obj.bytes<0||obj.bytes>5*1024*1024))return {ok:false,error:'INVALID_CHUNK'};
   if(type==='retrieval_chunk'&&!validId(obj.documentId))return {ok:false,error:'INVALID_DOCUMENT'};
   return {ok:true};
 }
 root.BV_AI_SCHEMA=Object.freeze({version:1,types,validate});
})(window);
