# BV-Note v3.7.8 Neon 分片部署（測試版）

## 安全前提
先備份 Neon，優先使用獨立測試 Worker 與資料庫。此版本的 v378 分片 API 使用 Session 所有權驗證；**原有 `/api/files` 舊 API 尚未完成所有權限制，不得在公開多使用者環境中啟用舊 API**。請勿直接替換正式 Worker 後宣稱完成安全隔離。

## Neon
在 Neon SQL Editor 執行 `cloud-worker/migrate_v3_7_8.sql`，只建立新表，保留既有 `cloud_files`、`commits`。舊資料不會自動遷移到新帳號。

## Cloudflare
在專案根目錄：
```powershell
cd .\cloud-worker
npm install
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler deploy
```
`wrangler.toml` 的 `ALLOWED_ORIGIN` 必須與 GitHub Pages Origin 相同。測試環境請改 Worker 名稱與 Origin，避免影響正式站。

## GitHub Pages
確認 `cloud-config.js` 指向測試 Worker，然後提交前端靜態檔至測試 Repository。不可提交 `.env`、資料庫連線字串或 API Key。

## 功能及限制
- 新的 `/api/v378` API：帳號清單、上傳會話、2 MiB 分片、斷點續傳、SHA-256、完整提交、下載分片。
- 單次 ZIP 上限 50 MiB；解壓上限 150 MiB / 1000 檔案。
- 「編輯」將 ZIP 內容保存於 IndexedDB，並在 Explorer 預覽第一個 MD/TXT。**完整多檔案樹狀編輯、跨頁面恢復 UI、同步修改回雲端尚未完成**。
- 新分片版本目前只支援完整 Commit，不支援增量 Commit；舊版本下載與刪除仍經舊 API。
- 上傳完成時 Worker 會組裝 ZIP 驗證 SHA-256，可能受 CPU/記憶體限制，50 MiB 尚未經雲端實測。
- 同一 Hash 的未完成上傳會在瀏覽器保留 upload_id，重試可查詢已上傳片段。
- 不要直接用在正式多使用者環境：舊 API 需完成授權整改，且新 API 的並行版本提交需加強交易一致性。

## 測試
1. 使用測試帳號登入，建立小型 ZIP，檢查 `bv_cloud_documents`、`bv_cloud_uploads`、`bv_cloud_parts`。
2. 重試上傳、重新整理後續傳；下載並比較 SHA-256。
3. 以另一帳號查詢 Hash，應收到 404。
4. 點編輯，確認 IndexedDB 有 `bv-note-cloud-roots-v378`。
5. 測試 2 MiB、5 MiB、20 MiB，觀察 Worker CPU 與 Neon 儲存。
