# BV-Note v3.8.5 — Cloud Transfer & Explorer Default Collapse

## 變更紀錄
- 增量分片上傳：保留 256 KiB 與 SHA-256，改為最多 3 個並行請求，減少大量分片逐一等待的延遲。
- 增量分片下載：最多 3 個並行請求；所有分片驗證後依 Manifest 順序重建 ZIP。
- Cloud Root 匯入：所有子資料夾預設收合，不再自動選取或展開第一個 Markdown 文件。
- 更新前端快取參數與版本標示 v3.8.5。

## 部署
備份現有專案並覆蓋 ZIP 內容後，在 PowerShell 執行：

```powershell
$Project = "E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages"
Set-Location $Project
node --check .\cloud.js
node --check .\explorer.js
node --check .\ui-v3518.js
git add cloud.js explorer.js ui-v3518.js index.html DEPLOY_V3_8_5.md
git commit -m "BV-Note v3.8.5 parallel chunk transfer and collapsed Cloud Root"
git push origin main
```

本次不需要 Neon Migration 或重新部署 Cloudflare Worker。

## 驗收
1. 登入後開啟 CLOUD，選取大型 Cloud Root 並執行 Commit，觀察 Network 同時最多 3 個 chunk PUT。
2. 下載增量版本，檢查 ZIP SHA-256 與解壓完整性。
3. 點擊「編輯」載入 Cloud Root，確認所有子 Fold 預設閉合且沒有自動開啟文件。

## 限制
分片大小仍為 256 KiB，優化主要針對網路往返延遲；若 Neon/Worker 同時請求限流，應將並行數降至 2。尚未進行正式環境整合測試。
