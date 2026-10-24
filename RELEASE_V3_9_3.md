# BV-Note v3.9.3 — Explorer 節點排序（完整原始碼）

## 版本來源
以 v3.9.0 完整原始碼快照為基底，套用 v3.9.2 Explorer 修復檔，移除 v3.9.1 已淘汰的 `/log` 頁面，再加入 v3.9.3 節點排序功能。此封包不包含 `.git` 歷史。

## 功能
- Explorer Root/Fold/文件右鍵新增「調整節點」。
- 進入排序模式後，同層項目可用上下箭頭，或拖曳到同層項目上調整順序。
- 再次選取「調整節點」退出排序模式。
- 本地 Root 透過 `.bv-note-explorer-order.json` 保存節點 UUID 與路徑順序。
- 雲端虛擬 Root 於 IndexedDB 快照及 Cloud Export entries 加入 `.bv-note-explorer-order.json`；重新載入時依路徑恢復順序。
- ZIP 匯出帶有順序中繼資料。
- 不會刪除使用者文件；保留 PowerShell `/log` 指令及後端資料表。

## 注意
1. 這是完整原始碼 ZIP，不是差異補丁；直接覆蓋現有專案可能覆蓋 v3.9.2 之後的其他修改。部署前請備份及檢查 git diff。
2. ZIP 不含 `.git`、node_modules、Worker secrets、Neon 資料庫內容。
3. 尚未在實際瀏覽器和正式 Worker 進行端到端測試；僅進行 JS 靜態語法檢查。
4. 舊雲端 ZIP 若無排序中繼資料，首次載入仍使用檔案原始順序，儲存後才會帶有順序紀錄。
5. 不需新的 Neon Migration。
