# BV-Note v3.3.1

- 綠色 Commit：可編輯並提交。
- 紅色 Submitted：成功提交後的檢視狀態；點擊即可返回編輯，恢復綠色 Commit。
- 輸入文字後確保 Commit 狀態更新，不再持續顯示 Submitted。
- 不變更 Cloudflare Worker 或 Neon schema。

## 部署
覆蓋前端檔案後 git add -u、git commit、git push。此版不需重新部署 Worker。
