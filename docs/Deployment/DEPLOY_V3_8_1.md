# BV-Note v3.8.1 — Chunk PUT 503 / CORS Hotfix

## 原因與處理
2026-10-23 的 Chrome Console 顯示 `PUT /api/v378/uploads/<uuid>/<index>` 回傳 `503 Service Unavailable`，瀏覽器同時回報缺少 `Access-Control-Allow-Origin` 與 `Failed to fetch`。此時 CORS 錯誤可能是 Worker/上游在回應前失敗的次生症狀；僅更改 CORS headers 無法解決 503。

上一版使用每片 2 MiB，Neon HTTP SQL 需把 BYTEA 編成 4 MiB 十六進位文字並傳送，可能造成執行時間/請求大小問題。本版新上傳採 256 KiB 分片，降低單次資料庫寫入與 Worker 記憶體負擔。保留舊版 2 MiB 上傳分片的讀取與續傳相容性。**實際 503 原因仍需 Worker tail 確認**，無法保證此變更能消除所有上游錯誤。

## 版本記錄
- v3.8.1: 新建上傳分片 2 MiB → 256 KiB；Worker 依上傳既有 `part_count` 判斷舊/新分片大小；前端動態選擇切片大小。
- v3.8.1: 更新前端資源查詢版本與畫面左上版本標示，避免快取仍使用舊 cloud.js。
- v3.8.1: 不修改 Neon schema、不刪除舊資料、不更改分片下載 API。

## 部署（PowerShell）
先備份程式碼及 Neon。解壓縮完整 ZIP 至 GitHub Pages 專案根目錄，合併覆蓋原檔。

```powershell
$Project = 'E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages'
Set-Location "$Project\cloud-worker"
node --check .\worker.js
node --check .\chunk-api.js
npx wrangler deploy
Set-Location $Project
node --check .\cloud.js
node --check .\ui-v3518.js
git status
git add cloud-worker/chunk-api.js cloud.js ui-v3518.js index.html DEPLOY_V3_8_1.md
git commit -m 'BV-Note v3.8.1 chunk upload 503 mitigation'
git push origin main
```

## 驗收
1. 強制重新整理（Ctrl+Shift+R），確認左上版本 v3.8.1。
2. 建立新的雲端文件，上傳 1–3 MiB ZIP，Network 觀察 PUT 各片大小約 262144 bytes。
3. 完成後下載並解壓，確認 SHA-256、檔案完整。
4. 測試 v3.8.0 已存在的 2 MiB 分片文件下載；不要刪除原資料。
5. 若仍出現 503，另開 PowerShell 在 Worker 目錄執行 `npx wrangler tail bv-note-cloud --format pretty`，重試一次並提供 tail 日誌及 Network 的 HTTP status；勿分享 token/Authorization 或文件內容。

## 已知限制
- Neon HTTP BYTEA 不是適合大型物件儲存的最終架構；高流量與 100 MiB 級 ZIP 建議改 Cloudflare R2 + Neon metadata。
- 舊版 `/api/files` 授權隔離問題不在本次 hotfix 範圍內，正式開放前需另行修復。
- 僅完成語法/封裝檢查，尚未連線正式環境測試。
