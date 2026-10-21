# BV-Note v3.5.12｜AI Explorer 導覽排版

- 以 v3.5.11 為基礎，AI-Explorer 標題列參考一般 Explorer：左側標題、右側 NOTE 返回按鈕。
- 導覽列改為 `BACK NOTE` + `CloseSider`，並將 `+ New Chat` + `Refresh` 獨立排列。
- 原 `BACK note-model` 改名 `BACK NOTE`，保留既有 `back()` 事件處理。
- 移除舊 `note` 重複位置，將同一按鈕移至標題列，不建立新事件或功能。
- 不修改 Worker 或既有聊天資料儲存邏輯。
