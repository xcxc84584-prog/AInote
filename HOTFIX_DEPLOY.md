# BV-Note v3.5.13 Auth Hotfix

## 修正內容
- `cloud-worker/auth.js`：將帳號/Session UUID 產生改為 `crypto.getRandomValues` 實作 RFC 4122 v4，避開某些環境的 `crypto.randomUUID()` 支援問題。
- 註冊流程加入 `phase` 分段診斷；錯誤僅寫入 Worker 日誌，不回傳內部錯誤給訪客。
- 保留原本 PBKDF2 參數、邀請碼驗證、資料表與既有前端。

## 部署（建議僅覆蓋 auth.js）
1. 在現有專案根目錄備份 `cloud-worker/auth.js`。
2. 將本 ZIP 的 `cloud-worker/auth.js` 複製覆蓋到現有專案相同位置；**不要整包覆蓋 wrangler.toml、Secrets 或 .git**。
3. 進入 `cloud-worker`，執行 `node --check .\auth.js`，再執行 `.\node_modules\.bin\wrangler.cmd deploy --config wrangler.toml`。
4. 執行 `wrangler tail bv-note-cloud --format pretty`，測試註冊。成功應回 201；若仍回 500，提供日誌 `AUTH_API_ERROR` 的 phase/name/message（不要提供密碼或邀請碼）。

## 注意
此修正根據 `NotSupportedError` 及原始碼作針對性改善，尚未在你的正式 Worker 上驗證。註冊仍為邀請碼測試版，沒有 Gmail 所有權驗證、限速等商用安全措施。
