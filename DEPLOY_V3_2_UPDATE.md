# BV-Note v3.2 更新與部署

## 變更
- 雲端頁面顯示進度條：掃描、ZIP 壓縮（使用 JSZip 回報的百分比）、API 呼叫與完成狀態。
- 建立 Fold ZIP 專案時，在內部 UI 選擇 1/7/14/30/90 天保存期限。
- 完整提交可重設期限，自完整提交時間起計算；增量提交沿用現有 `expires_at`。
- `filehashid.txt` 改為 JSON：`file_hash_id`, `life_days`, `expires_at`。仍能讀取舊版單行 UUID 格式。
- Worker 對過期文件拒絕一般查詢，Cloudflare Cron 每小時清理過期 `cloud_files`，`commits` 由資料庫 ON DELETE CASCADE 刪除。

## 部署順序（重要）
1. **先在 Neon SQL Editor 執行 `cloud-worker/migrate_v3_2.sql`**。既有資料不會被直接清除，舊資料的期限為 NULL（無期限）；此設計避免破壞舊資料。
2. 在 `cloud-worker` 執行 `npm.cmd install`（如尚未安裝）及 `npx.cmd wrangler deploy`。
3. 將新版前端推送至 GitHub Pages（例如 `git add . ; git commit -m "BV-Note v3.2 Expiration Progress" ; git push origin HEAD`）。
4. 測試：建立 1 天期限的測試 Fold、確認 filehashid.txt 的到期時間、測試完整提交改成 7 天、增量提交確認時間不變。

## 注意
- Cron 每小時執行一次；實體資料刪除可能晚於到期時間，但 API 在到期後不再提供一般讀取。這不是精確到秒的刪除排程。
- 進度條在 API 呼叫期間顯示階段進度，並非實際網路位元組傳輸百分比。
- `filehashid.txt` 內的 UUID 等同存取憑證，不要公開。
- 目前 ZIP 仍受 Worker 單筆 1 MiB（Base64 字串）限制。
- 原有 Worker 的無驗證 File Hash ID 授權設計未變；此版本不適合儲存機密資料。
- 不要在 GitHub 中提交 DATABASE_URL 或其他 Secret。
