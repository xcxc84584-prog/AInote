# BV-Note v3.7.8.1 修復包：部署與限制

## 修正

- CORS OPTIONS 允許 `X-BV-SHA256`。
- 新版分片文件使用 `/api/v378/files/:id` 刪除，伺服器驗證登入 Session 的 `owner_id`，外鍵連動刪除分片。
- 新版提交歷史：`GET /api/v378/files/:id/history`；刪除版本：`DELETE /api/v378/files/:id/history/:revision`（最後一版不可刪）。
- 指定歷史版本下載：`GET /api/v378/files/:id/meta?revision=N` 與 `/parts/:index?revision=N`。
- Explorer 雲端編輯會建立完整資料夾／檔案樹（含二進位檔案），存於 IndexedDB。點選文字或 PDF 檔案預覽。`Save` 將整個雲端虛擬 Root 存回 IndexedDB，不寫入本地資料夾。
- 新增 Explorer「還原 Cloud Root」按鈕：輸入 Fold Hash ID，從 IndexedDB 還原草稿。

## 部署

**先備份 Neon 與目前部署的程式。建議先用獨立 Worker/Neon 測試環境驗證。**

1. Neon SQL Editor：確認先前 `cloud-worker/migrate_v3_7_8.sql` 已執行。此修復包沒有新的資料庫遷移。
2. 將 ZIP 解壓至專案根目錄，覆蓋 `cloud.js`、`explorer.js`、`cloud-worker/chunk-api.js`、`cloud-worker/worker.js` 等檔案。
3. PowerShell：

```powershell
cd 'E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages\cloud-worker'
node --check .\worker.js
node --check .\chunk-api.js
npm install
npx wrangler deploy
cd ..
node --check .\cloud.js
node --check .\explorer.js
git add .
git commit -m 'Fix v3.7.8 cloud history delete and Explorer ZIP root'
git push origin main
```

4. GitHub Pages 更新後，Chrome `Ctrl+Shift+R`，測試上傳、歷史、下載歷史版本、刪除、編輯多層 Fold、重新整理後還原 Cloud Root。
5. 在兩個不同帳號中測試相同 File Hash ID 的存取：非所有者必須被拒絕。

## 重要限制（未驗證正式環境）

- 本包經 Node 語法檢查，但**未在你的 Neon/Cloudflare/GitHub 環境進行端對端測試**。
- 舊 `/api/files` API 仍沿用舊版 Hash ID 權限模式，**不能視為已完成多使用者安全整改**。正式公開前應停用或遷移舊 API 並完成所有權驗證。
- `chunk-api.js` 完成上傳時仍在 Worker 記憶體重組 ZIP 並計算整體 SHA-256；50 MiB 只是程式限制，不保證 Cloudflare/Neon 在該大小下成功。大檔案需要另行改為分段驗證或串流架構並實測。
- 新版虛擬 Root 的 `Save` 只存 IndexedDB；不會自動上傳 Neon。雲端 Commit 路徑仍需針對虛擬 Root 另行整合。
- `IndexedDB` 由瀏覽器管理，可能因使用者清除網站資料而遺失；重要文件仍需另行備份。
- ZIP 內有純二進位檔案，Explorer 可顯示樹，但不是每一種檔案類型都支援預覽或編輯。
