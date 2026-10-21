# AREA List｜BV-Note v3.5.12

每個 AREA 以檔案為穩定邊界，內部函式可在下一階段再拆分。`START/END` 是檔案級註記，不代表檔案只執行單一功能。

| AREA | 名稱 | 檔案 | 輸入 | 輸出 | 主要責任 |
|---|---|---|---|---|---|
| A01 | TOCAndAnnotations | `toc.js` | 標題、選取範圍 | 目錄與標記狀態 | actions、addMark、button、clean、decorate |
| A02 | ExplorerManager | `explorer.js` | 本地檔案、操作事件 | 檔案樹、檔案讀寫結果 | canonicalRecordKey、captureRecordPaths、choose、clipTargets、cloneChildren |
| A03 | MarkdownRenderer | `renderer.js` | 原始 Markdown | 已淨化 HTML、公式與圖形 | atom、esc、group、hold、inline |
| A04 | CloudConfiguration | `cloud-config.js` | 部署者 Worker URL | window.BV_CLOUD_API_URL | 依檔案事件與函式 |
| A05 | MermaidSupport | `mermaid-support.js` | DOM 事件或模組輸入 | UI、資料或狀態更新 | escapeHTML、fallback |
| A06 | EditorController | `app.js` | 編輯事件、原始 Markdown | 更新後 Markdown、UI 狀態 | changed、close、dataURL、download、escapedNewlines |
| A07 | PDFViewer | `pdf-viewer.js` | DOM 事件或模組輸入 | UI、資料或狀態更新 | finish、hide、show |
| A08 | CloudClient | `cloud.js` | 使用者操作、雲端 API JSON | 雲端 UI 與文件資料 | $、api、apiUrl、base64ToBytes、buildIncremental |
| A09 | AIChatManager | `ai-chat-ui.js` | 匯入聊天、使用者提示、API 回應 | QA 區塊、聊天列表 | $、back、createChat、current、deleteBlock |
| A10 | BYOKProxy | `ai-byok-worker/worker.js` | POST /ai/responses、使用者 API Key | 上游 Responses API JSON / 錯誤 | reply |
| A11 | CloudAPI | `cloud-worker/worker.js` | HTTP API、Neon 連線 | 雲端文件/版本/專案 JSON | hex、lifeDays、reply、safe、uuid |
