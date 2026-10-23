# BV-Note v3.8.6 — Reliable Chunk Upload

## Changes
- Up to five retries for transient start, status, and part-upload failures, with exponential backoff and jitter.
- If a PUT response is lost, check the server part list before treating it as failed.
- If Complete fails or the response is lost, query server upload state before retrying Complete.
- Keep the resumable upload ID until server completion is confirmed.
- Preserve SHA-256 validation, original chunk sizes, and Neon schema.
- Keep Cloud Root folders initially collapsed (v3.8.5).

## Deployment
Back up project first. Unzip to project root, then:

```powershell
$Project = "E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages"
Set-Location $Project
node --check .\cloud.js
node --check .\explorer.js
git add cloud.js index.html ui-v3518.js DEPLOY_V3_8_6.md
git commit -m "BV-Note v3.8.6 resilient chunk upload"
git push origin main
```

No Worker redeploy or Neon migration. Check site version v3.8.6; test repeated 32-part upload, Complete recovery, and full ZIP download/hash verification.

## Limits
The Worker Complete endpoint still re-reads each part for full-file SHA-256 validation. If it repeatedly exceeds platform limits, a backend design change will be needed. Do not claim that a successful upload guarantees download without testing.
