# BV-Note v3.8.2 — Account Cloud Listing and Root Selection

## Version log
- CLOUD 頁面開啟時，登入狀態下自動呼叫 `/api/v378/files`，列出該帳號目前有效且未過期的雲端文件。
- 保留空白 Search 查詢：顯示目前帳號有效文件，不需輸入 UUID。
- 建立雲端專案：選中 File 時自動使用其所在 Explorer Root；選中 Fold 時使用選中的 Fold；選中 Root 時使用 Root。
- Commit：沒有選取 Root、Fold、File 時，顯示「請先選擇上傳文件」。
- 更新左上角版本文字為 v3.8.2；更新 cloud.js 與 explorer.js cache-busting。

## Deployment (PowerShell)
先備份專案與 Neon 資料庫。將 ZIP 解壓覆蓋專案根目錄。

```powershell
$Project = "E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages"
Set-Location $Project
node --check .\cloud.js
node --check .\explorer.js
node --check .\ui-v3518.js
git status
git add cloud.js explorer.js ui-v3518.js index.html DEPLOY_V3_8_2.md
git commit -m "BV-Note v3.8.2 cloud listing and root selection"
git push origin main
```

此版只修改前端，不需要重新部署 Worker，也不需要執行 SQL。

## Acceptance
1. 登入 → CLOUD：自動顯示帳號目前有效的雲端文件。
2. Search 留空按 Search：顯示相同清單。
3. 在 Explorer 選中 File → 建立雲端專案：打包所屬 Root。
4. 選中 Fold → 建立雲端專案：打包所選 Fold。
5. 未選任何 Root/Fold/File → Commit 或建立：顯示「請先選擇上傳文件」。
6. 使用另一帳號登入，確認不會顯示第一帳號的文件。

## Known limitation
帳號清單以 `bv_cloud_documents.owner_id` 及 `expires_at > NOW()` 為準，已刪除或過期文件不顯示；既有舊版 `/api/files` 的歷史資料若未遷移至 v378 表，不會出現在清單。Cloud Root 的 ZIP 大檔案傳輸及舊 API 權限隔離需要獨立整合測試。
