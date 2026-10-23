# BV-Note v3.3 — 安全部署說明

本包以 v3.2 的原始 UTF-8 HTML 為基礎，更新 v3.3 增量提交程式及 Cloudflare Worker。

## 重要
- 不要使用 PowerShell `Get-Content | Set-Content` 重新編碼 index.html。
- 先備份 Neon 資料和現有專案；不要執行 schema.sql / migrate_v3_2.sql。
- 此包不會自動部署，需自行覆蓋 GitHub Pages 專案的對應檔案。
- `filehashid.txt` 是雲端識別碼，不是檔案內容 SHA-256。
- 每次增量提交會比較 ZIP 中每個檔案的 SHA-256；相同不傳送，不同傳送差異；後端重建完整 ZIP 快照。
- 差異提交前仍需下載現有 ZIP 進行比較；傳輸量優勢主要在上傳方向。
- 進度條僅於明確操作時顯示，百分比為階段估計值。
- Worker 每筆重建 ZIP 限制為 Base64 1 MiB。

## 部署
在解壓縮資料夾內，將前端檔案複製到 GitHub 專案根目錄（保留 .git）；確認 `index.html` 中文顯示及 `cloud-config.js` URL 正確。

```powershell
git add -u
git commit -m "BV-Note v3.3 incremental hash sync"
git push origin main
cd cloud-worker
npm.cmd install
npx.cmd wrangler deploy
```

## 驗證
1. Chrome Console: `window.BV_CLOUD_API_URL` 應是實際 Worker URL。
2. `document.getElementById("cloud-search-button")` 不應為 null。
3. 同一文件連續提交兩次，第二次應跳過。
4. 修改單一檔案、刪除檔案、下載並確認 ZIP 內容。
5. 閒置時進度條不應出現。
