/* AREA A-D1666F64 START: ai-byok-worker/worker.js */
// AREA A10 START: BYOKProxy | File: ai-byok-worker/worker.js
// sEAPP AREA AIRequestProxy: BYOK relay. Never persist or log user API keys.
const MAX_BODY = 12000000;
export default {
  async fetch(request, env) {/* BLOCK B-BD4EB095CD START: AREA A-D1666F64 */
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
    const cors = allowed.includes(origin) ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-BV-User-Key',
      'Vary': 'Origin'
    } : null;
    const reply = (data, status) => new Response(JSON.stringify(data), {
      status, headers: {'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store', ...(cors || {})}
    });
    if (!cors) return reply({error:{message:'Origin not allowed'}},403);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (new URL(request.url).pathname !== '/ai/responses' || request.method !== 'POST') return reply({error:{message:'Not found'}},404);
    const key = request.headers.get('X-BV-User-Key') || '';
    if (!/^sk-[\w-]{12,}$/.test(key)) return reply({error:{message:'Invalid API key format'}},400);
    if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return reply({error:{message:'Request too large'}},413);
    let raw;
    try { raw = await request.text(); if (raw.length > MAX_BODY) return reply({error:{message:'Request too large'}},413); }
    catch { return reply({error:{message:'Invalid request body'}},400); }
    let payload;
    try {payload=JSON.parse(raw);}catch{return reply({error:{message:'Invalid JSON'}},400);}
    if (!payload || typeof payload.model !== 'string' || !Array.isArray(payload.input) || payload.input.length > 300) return reply({error:{message:'Invalid request schema'}},400);
    try {
      const upstream = await fetch('https://api.openai.com/v1/responses', {
        method:'POST', headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:raw, redirect:'manual'
      });
      const text=await upstream.text();
      return new Response(text, {status:upstream.status,headers:{...cors,'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
    } catch (error) {
      // Do not log request headers, API keys, or request bodies.
      const type = error instanceof Error ? error.name : 'UnknownError';
      const message = error instanceof Error ? String(error.message).slice(0, 240) : 'Unknown upstream exception';
      console.error('BV_BYOK_UPSTREAM_FAILURE', { type, message: message.replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]') });
      return reply({error:{message:'Upstream request failed',code:'OPENAI_UPSTREAM_FETCH_ERROR',type}},502);
    }
  /* BLOCK B-BD4EB095CD END. */}
};
// AREA A10 END: BYOKProxy

/* AREA A-D1666F64 END. */
