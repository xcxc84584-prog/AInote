# BV-Note v3.3.2

- Commit（綠）點擊後，只有儲存成功才切換為 Submitted（紅）。
- Submitted 顯示 2 秒後自動回到 Commit（綠）和編輯模式。
- 儲存失敗不啟動倒數。
- 手動切換或其他切換模式會取消原先倒數，避免延遲回呼覆蓋新狀態。
- 只需部署前端 `explorer.js` 與 `index.html`，不需要重新部署 Worker 或修改資料庫。
