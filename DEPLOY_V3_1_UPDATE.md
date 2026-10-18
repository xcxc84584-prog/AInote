# BV-Note v3.1｜Cloud Fold ZIP 更新

## 變更
- 建立新雲端專案：需在 Explorer 選取 Root 或 Fold，打包其內容為 ZIP；不支援單檔上傳。
- 建立成功後於該 Root/Fold 寫入 `filehashid.txt`（請妥善保管，任何持有者均可能存取與刪除雲端內容）。
- Cloud Commit：固定提交 Explorer 的 Root，Root 必須有 `filehashid.txt`。模式選擇改成頁面內 UI。
- Commit 狀態：成功提交後顯示紅色 Submitted；掃描 Root 檔案內容改變後恢復綠色 Commit（約每 6 秒掃描一次）。
- 提交歷史：每筆增加刪除紀錄按鈕；最後一筆版本不允許單獨刪除。版本序號可能不連續。
- 下載：雲端儲存的是 ZIP 的 Base64 編碼，下載時解碼為原始 ZIP。

## 部署
1. 替換 GitHub Pages 前端檔案 `cloud.js`、`explorer.js`、`index.html`、`style.css`。
2. `cd cloud-worker` 後執行 `npx.cmd wrangler deploy`，更新 CORS 與歷史刪除路由。
3. Git commit / push 更新 GitHub Pages，強制重新整理網站。
4. 不需修改既有 Neon schema。

## 相容性與限制
- 舊版以純文字存放的雲端文件不能直接當 ZIP 下載；需重新建立 ZIP 專案。
- 目前沿用資料表 `cloud_files` 與 `commits`，以一筆 Base64 字串存一份 ZIP，單次提交仍受 Worker 的 1 MiB 文字限制；大型專案應改採 R2 物件儲存。
- ZIP 掃描會讀取本地 Root 全部文件；大型 Root 在手機上可能耗時。
- FileHashID 為 bearer secret，沒有使用者登入及權限分離；請勿上傳敏感資料。
- 刪除任一版本是不可復原的永久刪除；最後一筆提交受保護。
- 這是原始碼靜態檢查版本，尚未經實際瀏覽器與 Neon 端到端測試。
