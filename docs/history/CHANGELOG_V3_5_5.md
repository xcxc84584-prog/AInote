# BV-Note v3.5.5｜Shared Link Local Registry

- 移除 Chrome Extension 目錄、Extension ID、訊息橋接與連線按鈕。
- 分享連結作為主要來源；CORS 失敗時提示使用者手動複製分享頁面文字。
- AI-Explorer 改為 IndexedDB 本地聊天目錄表格，點擊時才讀取聊天全文。
- 沿用既有 Markdown renderer、Block Edit/Commit、Save/Download。
- Save Chat 下載 .md，並更新本地 IndexedDB 紀錄；不會覆寫原磁碟檔案。
- 未執行端對端瀏覽器測試。
