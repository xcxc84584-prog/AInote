# BV-Note v3.3.6

- 新增獨立 `pdf-viewer.js`，使用瀏覽器內建 PDF 檢視器，唯讀且不經 Markdown 編譯。
- Explorer 掃描與本地匯入支援 `.pdf`，保留二進位內容。
- 選擇 PDF 時隱藏 Markdown 編輯器與本地 Commit/Edit 按鈕。
- 切換文件時釋放 Blob URL，避免資源持續占用。
- Chrome/Edge 原生 PDF 檢視器支援的縮放、頁面導覽與列印功能由瀏覽器提供。
- 不變更 Worker 或資料庫。
