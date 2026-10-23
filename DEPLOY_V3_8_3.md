# BV-Note v3.8.3｜Cloud Root 真正增量儲存

日期：2026-10-23

## Version Log

- 重新載入頁面後，等待登入憑證恢復，自動執行一次 CLOUD 空白搜尋，列出目前登入帳號的有效雲端文件。
- Cloud Root Commit 改用內容定址（SHA-256）的 256 KiB 分片。相同內容的分片只上傳一次；修改或新增文件只傳缺少的分片，刪除文件只更新 manifest。
- Neon 新增 `bv_delta_chunks`（依 owner_id + SHA-256 去重）及 `bv_delta_revisions`（完整路徑、檔案大小、分片引用），每個 Revision 保存完整 manifest，不依賴前一版還原。
- 下載與「編輯」增量版本時，讀取 manifest，按雜湊下載並驗證分片，於瀏覽器重建 ZIP；舊版完整 ZIP 仍透過 v378 API 讀取。
- v378 meta 與歷史清單支援 delta revision；舊版全量上傳可繼續建立新 Revision。
- 網站版本標籤及資源快取版本更新為 v3.8.3。

## 重要部署順序（不可顛倒）

1. **先備份 Neon 資料庫及現有網站。**
2. 於 Neon SQL Editor 執行 `cloud-worker/migrate_v3_8_3_delta.sql`。本檔只新增資料表及索引，不刪除既有資料。
3. 解壓並覆蓋前端與 Worker 程式。
4. 在專案根目錄 PowerShell 執行：

```powershell
$Project = 'E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages'
Set-Location "$Project\cloud-worker"
npm install
node --check .\worker.js
node --check .\chunk-api.js
node --check .\delta-api.js
npx wrangler deploy
Set-Location $Project
node --check .\cloud.js
node --check .\explorer.js
git status
git add cloud.js index.html ui-v3518.js cloud-worker/worker.js cloud-worker/chunk-api.js cloud-worker/delta-api.js cloud-worker/migrate_v3_8_3_delta.sql DEPLOY_V3_8_3.md
git commit -m 'BV-Note v3.8.3 delta cloud storage'
git push origin main
```

## 驗收

1. 重新整理網站，確認登入後 CLOUD 空白搜尋能列出自己的有效文件（不需要手動按 Search）。
2. 將舊版全量 ZIP 點「編輯」，在 Explorer 修改一個 Markdown 文件，按 CLOUD 的 Commit。確認 `/api/v383/chunks/missing`、`PUT /api/v383/chunks/{sha256}` 和 `/api/v383/files/{uuid}/commit` 成功。
3. 不修改內容再次 Commit：應顯示 0 個新分片，Revision 仍會增加。
4. 下載新版 Revision，解壓 ZIP 並核對所有檔案內容與路徑；歷史版本仍可下載。
5. 新增與刪除檔案後再 Commit，驗證新 ZIP 的檔案清單。
6. 使用第二個帳號測試不能取得第一個帳號的 manifest 或分片。

## 已知限制及安全事項

- 單一分片 256 KiB；單個 Root 所有檔案的原始大小總和上限 100 MiB，最多 2000 個項目。大型 Root 仍會在瀏覽器重建 ZIP，受瀏覽器記憶體限制。
- 第一次將舊版全量 ZIP 轉成增量格式，所有尚未存入增量儲存區的分片需要上傳一次；其後才會只上傳變更的分片。
- 新增的分片採帳號隔離，不跨帳號共用。
- 刪除文件會刪除其 Revision manifest，但內容定址分片目前不會自動回收；正式上線前應規劃可驗證的孤兒分片清理程序。
- v383 的 revision claim 與 manifest INSERT 分成兩個 SQL 請求；失敗時有回滾嘗試，但尚未達到資料庫原子交易保證。高併發提交應改為資料庫交易或 RPC。
- 舊版 `/api/files` 的授權隔離仍須獨立完成安全性修復。
- 尚未在正式 Neon／Cloudflare 帳號完成端對端測試；不要以語法檢查代替實際上傳、下載與權限驗證。
