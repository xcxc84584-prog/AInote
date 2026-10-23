# BV-Note v3.8.8｜Cloud Root 操作權限與傳輸優化

## 版本更新
- Cloud Root 可新增、重新命名、刪除、移動、複製、貼上 File/Fold；保留 Explorer 搜尋、編輯、儲存與 ZIP 匯出功能。
- 支援選取本地多個文件匯入 Cloud Root；新增「導入 Fold 至 Cloud」可匯入整個資料夾結構。所有修改先寫入 IndexedDB，不會寫入本地磁碟；Cloud Commit 才會上傳。
- 原有增量提交（依 SHA-256 去重）不變；完整 ZIP 分片上傳和下載改為最多三個同時進行的請求，保留逐片與完整 ZIP 驗證、失敗重試與續傳。
- Cloud Root 匯入後資料夾維持預設收合。

## 部署（PowerShell）
1. 備份現有程式，將本 ZIP 解壓至原專案。
2. 執行：

```powershell
$Project = 'E:\PortableEnvironment v1\WebDev\Project\BV_Note-web server\AInote_v1.5.2_GitHub_Pages'
Set-Location $Project
node --check .\explorer.js
node --check .\cloud.js
node --check .\ui-v3518.js
git add explorer.js cloud.js index.html ui-v3518.js DEPLOY_V3_8_8.md
git diff --cached --check
git commit -m 'BV-Note v3.8.8 Cloud Root operations and transfer optimization'
git push origin main
```

本版只修改前端，不需要執行 Neon SQL，也不需要重新部署 Worker。

## 驗收
1. 以 CLOUD 編輯既有 ZIP；所有 Fold 預設閉合。
2. 新增、重新命名、刪除、移動、複製貼上文件與資料夾。
3. 透過「選取本地文件」匯入多個文件，及「導入 Fold 至 Cloud」匯入資料夾。
4. Save 後重新載入、Commit、下載完整 ZIP，檢查檔案結構與內容。
5. 測試 32 分片 ZIP 上傳下載；同時最多 3 個分片請求。

## 已知限制
- 尚未在正式網站進行端對端整合測試；請先備份雲端文件並測試操作。
- 完整 ZIP Complete 階段仍可能受 Cloudflare Worker / Neon 資源限制。
- 原有舊版 API 授權安全問題不在此次修正範圍。
