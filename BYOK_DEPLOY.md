# BV-Note v3.5.10 — BYOK Deployment Guide

## 1. Deploy the site
Deploy this website to HTTPS hosting (e.g. GitHub Pages). Do not embed API keys in the repository, URLs, localStorage, or Worker variables.

## 2. Deploy the isolated AI proxy
Install Node.js / Wrangler, authenticate with `npx wrangler login`, then:

```powershell
cd ai-byok-worker
npx wrangler deploy
```

**Before deploying**, replace `ALLOWED_ORIGINS` in `ai-byok-worker/wrangler.toml` with your actual site origin (for example `https://example.github.io`, not the `/repository/` path). The proxy is independent from the existing BV-Note cloud Worker; this avoids accidentally breaking cloud file storage.

Copy the resulting Worker HTTPS address and append `/ai/responses`.

## 3. Test in the browser
1. Open the deployed BV-Note over HTTPS.
2. Enter AI Chat; create a chat.
3. Open **AI / API**, set `API Proxy URL`, OpenAI model and your own API Key.
4. Enter `Hello` and press SEND.
5. Confirm Q1 and A1 appear. A failed API request retains Q1 and shows an error.
6. Test right-click Download/Delete, drag reorder, mobile long-press menu, switch-chat autosave, refresh and BACK note-model.

## 4. Security notes
- This Worker forwards a BYOK key per request, does not save it, and sets `Cache-Control: no-store`. The frontend keeps the key only in page memory.
- **Do not deploy the Worker with a wildcard origin**. An origin allowlist is necessary but not sufficient to prevent malicious traffic or abuse. Add rate limiting, abuse controls, authentication and usage caps before opening a high-traffic public service.
- The Worker operator can technically access request credentials. Users must trust the BV-Note service operator. Do not use untrusted third-party proxies.
- Existing chats remain stored in browser localStorage in this version. This is device/browser-specific, has capacity limits, and is not encrypted. Do not store sensitive data.
- `SAVE` writes browser storage, not a server or existing `.md` on disk. Use `DOWNLOAD` for a file backup.
- ChatGPT Plus/Pro subscriptions do not cover OpenAI API usage. API billing is separate.
- The Worker sends content to the OpenAI API; images must fit the request size limit. A future version should migrate localStorage to IndexedDB and implement streaming, retries, and secure account-based quotas.
