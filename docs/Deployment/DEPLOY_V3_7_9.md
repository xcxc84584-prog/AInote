# BV-Note v3.7.9｜Cloud Root Commit 與分片串流驗證

## 本版內容
- 新增「提交 Cloud Root」按鈕，從目前 Explorer 的虛擬 Root 建立 ZIP 並上傳至 Neon，不寫入本地資料夾。
- 分片上傳保持 2 MiB，ZIP 大小上限調整為 100 MiB（瀏覽器端壓縮及解壓仍需額外記憶體）。
- Worker 完成上傳時，逐片驗證 SHA-256，使用增量 SHA-256，不再一次重建完整 ZIP 的 Uint8Array。
- 保留 IndexedDB 草稿、完整樹狀 Explorer、歷史及刪除功能。

## 部署
1. 備份目前 Git 專案及 Neon 資料庫。不要覆寫 `.env`、Secret 或實際的 `wrangler.toml` 設定。
2. 解壓並將檔案合併到專案根目錄。
3. `cd cloud-worker`，執行 `npm install`，`node --check worker.js`，`node --check chunk-api.js`，`npx wrangler deploy`。
4. 回到專案根目錄，執行 `node --check cloud.js`、`node --check explorer.js`。
5. `git status` 檢查後，`git add cloud.js explorer.js cloud-worker/chunk-api.js DEPLOY_V3_7_9.md`，再 `git commit -m "BV-Note v3.7.9 cloud virtual commit"`、`git push origin main`。

## 驗收
1. 用「編輯」載入多層 ZIP；修改 MD；按 Save 存入 IndexedDB；點「提交 Cloud Root」。
2. 查看歷史是否新增 Revision，下載新版並核對 SHA-256 及檔案內容。
3. 測試中斷分片後重新上傳、其他帳號不可存取、過期文件、版本衝突。

## 已知限制
- Neon BYTEA 仍有資料庫儲存及查詢成本；100 MiB 是程式限制而非已驗證的服務保證。
- 瀏覽器 JSZip 仍將 ZIP 放在記憶體中，超大型 ZIP 可能耗盡記憶體。
- 舊版 `/api/files` 路由的所有權隔離未在此版全面改造；部署前應限制或關閉不安全舊路由。
- Worker 上傳完成的版本更新尚非跨資料表原子交易；並發上傳需在後續版加強。
- 本版未執行實際 Neon / Cloudflare 端對端測試。
