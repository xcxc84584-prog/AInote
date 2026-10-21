# Log 管理與保留政策

- GitHub Pages：靜態站點，不應在 Repository 內寫入執行日誌。
- 前端：避免 console 輸出 Markdown、API Key、聊天內容或使用者檔案；錯誤 UI 僅顯示必要訊息。
- BYOK Worker：不得記錄 `X-BV-User-Key`、Authorization、請求內文；502 僅記錄經遮罩的錯誤類型。
- Cloud Worker：禁止記錄 DATABASE_URL、文件內容與完整文件 ID；使用 Cloudflare 平台日誌保留設定管理，並依方案限制保留期。
- 資料庫 commits：**不是 Log**，屬於版本資料，禁止用 Log 輪替規則刪除。
- 過期雲端文件：`cloud-worker/wrangler.toml` 的 hourly cron 執行過期清理，應確認 DB 外鍵 cascade 規則。
- 本地開發 Log：寫入 `logs/`（已 gitignore）；建議保留 7 天、單檔 5 MiB、最多 10 個，超額先刪最舊檔。
- 舊版 CHANGELOG 已移入 `docs/history/`，僅移動未刪除。

## Windows PowerShell 手動清理開發日誌（可選）

```powershell
Get-ChildItem .\logs -File -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item -WhatIf
```

確認列表後移除 `-WhatIf` 才會真正刪除。請勿對 `commits` 資料表執行這種清理。
