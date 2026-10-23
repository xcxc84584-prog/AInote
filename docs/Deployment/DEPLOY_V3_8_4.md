# BV-Note v3.8.4 | ZIP path fix

## Root cause
ZIP directory paths legitimately end with `/`. The previous Explorer validation split `Root/docs/` into `Root`, `docs`, and an empty component and rejected it as unsafe.

## Changes
- Permit trailing `/` for directory entries; normalize directory paths.
- Normalize Windows backslashes before validating path segments.
- Still reject absolute paths, drive-letter paths, `.` and `..` components, empty internal segments, and NUL characters.
- Update version label and cache bust Explorer script.

## Deploy (PowerShell)
Extract ZIP over your project after backup.

```powershell
$Project = "E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages"
Set-Location $Project
node --check .\explorer.js
git add explorer.js index.html ui-v3518.js DEPLOY_V3_8_4.md
git commit -m "Fix ZIP directory import v3.8.4"
git push origin main
```

No Neon SQL migration or Worker redeploy is required for this path fix. After publishing, hard refresh and test Cloud > 編輯 with nested ZIP directories. This patch does not fix unrelated manifest/history API 404/500 responses.
