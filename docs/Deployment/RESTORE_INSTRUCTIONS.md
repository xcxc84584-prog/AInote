# BV-Note v3.2 回退部署包

已修復 `cloud-config.js` 的 Worker URL 與 `index.html` 版本顯示。其他程式檔案保留原始 v3.2。

1. 解壓縮此 ZIP 到獨立資料夾。
2. 在該資料夾 PowerShell 執行 `powershell -NoProfile -ExecutionPolicy Bypass -File .\RESTORE_V3_2.ps1`。腳本會備份被覆蓋的檔案到專案內 `backup-before-v3.2-*`，並複製 v3.2 程式檔案。
3. 在專案根目錄確認 `git diff`、`git status`，然後 `git add index.html cloud-config.js cloud.js app.js explorer.js renderer.js mermaid-support.js style.css toc.js cloud-worker/worker.js cloud-worker/wrangler.toml cloud-worker/package.json`、`git commit -m "Restore BV-Note v3.2"`、`git push origin main`。
4. 進入 `cloud-worker`，執行 `npm.cmd install`、`npx.cmd wrangler deploy`。這一步會更新 Worker；不會自動執行 SQL 遷移。
5. GitHub Pages 部署完成後硬重新整理，Console 檢查 `window.BV_CLOUD_API_URL`。

**注意：** 本包不會修改 Neon 資料庫，不保證 v3.3 寫入的資料與 v3.2 完全相容。請先備份重要雲端文件。腳本不會自動執行 git push 或 wrangler deploy。
