# BV-Note v3.3｜增量提交與 Hash 驗證

- 每次 Incremental Commit 比較本地檔案與雲端最新 ZIP 內每個檔案的 SHA-256。
- 只傳送新增／修改檔案的 Base64 內容，以及刪除檔案的路徑清單。
- Worker 將差異套用到雲端基礎 ZIP，重建完整 ZIP 快照，既有下載及版本紀錄 API 保持相容。
- Hash 相同不產生新版本。Full Commit 仍支援完整 ZIP 與保存期限更新。
- 停止每六秒自動壓縮檔案的背景掃描，避免無操作時出現進度條。
- 進度條只由實際雲端操作啟動，結束後隱藏。

## 部署
1. 在 `cloud-worker` 目錄執行 `npm install` 安裝新增的 jszip 依賴。
2. 執行 `npx wrangler deploy` 部署 Worker。
3. 更新 GitHub Pages 前端文件並重新整理。
4. 不需資料庫 migration；增量網路傳輸後在 Worker 重建完整 ZIP 存入原有 commits.content 欄位。

## 限制
- 仍受重建 ZIP 1 MiB 限制；大檔案需日後改用物件儲存。
- 既有服務無使用者驗證，請勿在不可信環境保存敏感文件。
- 進度百分比是作業階段估計，不是精確網路位元組傳輸百分比。
- 單一檔案內容 SHA-256 在比較時即時計算；版本歷史仍保留完整 ZIP SHA-256。
