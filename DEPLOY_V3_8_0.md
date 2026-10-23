# BV-Note v3.8.0 修復與部署

## 變更
- 下載分片 ZIP 改為直接處理 Uint8Array，避免大檔 Base64 複製，並用原始版本 metadata 建立 filehashid.txt。
- Explorer 移除「還原 Cloud Root」按鈕，保留 IndexedDB 儲存功能。
- CLOUD 只保留一個 Commit 按鈕：當前 Root 是 IndexedDB Cloud Root 時直接提交；否則提交本地 Root。
- Fold Hash ID 僅存在於目前有效的帳號文件：`bv_cloud_documents` 綁定 owner_id；刪除文件會透過外鍵 CASCADE 刪除分片及歷史，沒有永久 ID 登記表。
- 分片完成請求可安全重試。

## 部署步驟（Windows PowerShell）
1. 備份 Git 專案與 Neon 資料庫。
2. 解壓完整 ZIP 至 BV-Note 專案根目錄，保留既有 wrangler Secret。
3. 在 `cloud-worker` 執行 `npm install`、`node --check worker.js`、`node --check chunk-api.js`、`npx wrangler deploy`。
4. 返回專案根目錄執行 `node --check cloud.js`、`node --check explorer.js`。
5. 執行 `git status`，確認沒有機密檔案後 `git add cloud.js explorer.js cloud-worker/chunk-api.js DEPLOY_V3_8_0.md`、`git commit -m "BV-Note v3.8.0 cloud fixes"`、`git push origin main`。
6. 清除前端快取，驗收 1/多分片 ZIP 下載、歷史版本下載、Cloud Root Commit、本地 Root Commit、刪除後空白搜尋。

## 限制
- ZIP 上限仍為 100 MiB；在瀏覽器端解壓、重新壓縮仍需記憶體。
- 大檔案能否成功下載取決於瀏覽器、Neon 回應、網路；此版完成語法檢查，未經正式環境整合測試。
- 舊版 `/api/files` 路由授權安全性尚需另行全面審查，正式環境應限制舊路由。
