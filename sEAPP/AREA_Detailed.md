# AREA Detailed｜程式碼對應與契約

## A01 TOCAndAnnotations

- **檔案**：`toc.js`
- **輸入**：標題、選取範圍
- **輸出**：目錄與標記狀態
- **主要函式（靜態擷取，非完整 call graph）**：`actions`, `addMark`, `button`, `clean`, `decorate`, `downloadMarkList`, `getSelected`, `hideMarkFloat`, `imageMarkdown`, `insertSelectedImage`, `locate`, `readRecords`, `reconcile`, `rememberSelection`, `renderMarks`, `renderPanel`, `resolveMarkOffset`, `saveRecords`, `selectionAnchor`, `showMarkFloat`, `showMenu`, `showPopup`, `storeKey`, `wrapText`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A02 ExplorerManager

- **檔案**：`explorer.js`
- **輸入**：本地檔案、操作事件
- **輸出**：檔案樹、檔案讀寫結果
- **主要函式（靜態擷取，非完整 call graph）**：`canonicalRecordKey`, `captureRecordPaths`, `choose`, `clipTargets`, `cloneChildren`, `closeRoot`, `collect`, `copyNode`, `copyVerify`, `create`, `current`, `deleteTargets`, `dirOf`, `display`, `done`, `draw`, `exportNode`, `flushNodeDB`, `flushRecordDB`, `importFiles`, `inlineName`, `isChild`, `isPdfFile`, `loadNodeDB`, `loadOrders`, `loadRecordDB`, `makeZip`, `menu`, `move`, `moveWithPicker`, `normalizeNewFileName`, `normalizeOrders`, `openRoot`, `openRootFromHandle`, `operateMenu`, `pasteTargets`, `path`, `positionMenu`, `previousSession`, `readingKey`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A03 MarkdownRenderer

- **檔案**：`renderer.js`
- **輸入**：原始 Markdown
- **輸出**：已淨化 HTML、公式與圖形
- **主要函式（靜態擷取，非完整 call graph）**：`atom`, `esc`, `group`, `hold`, `inline`, `markdownToHTML`, `parse`, `parseDocument`, `protectMath`, `renderMathElements`, `row`, `strip`, `svgDataImages`, `texToMathML`, `wrap`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A04 CloudConfiguration

- **檔案**：`cloud-config.js`
- **輸入**：部署者 Worker URL
- **輸出**：window.BV_CLOUD_API_URL
- **主要函式（靜態擷取，非完整 call graph）**：參閱原始碼
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A05 MermaidSupport

- **檔案**：`mermaid-support.js`
- **輸入**：DOM / module input
- **輸出**：UI / data output
- **主要函式（靜態擷取，非完整 call graph）**：`escapeHTML`, `fallback`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A06 EditorController

- **檔案**：`app.js`
- **輸入**：編輯事件、原始 Markdown
- **輸出**：更新後 Markdown、UI 狀態
- **主要函式（靜態擷取，非完整 call graph）**：`changed`, `close`, `dataURL`, `download`, `escapedNewlines`, `hasPendingMath`, `htmlToMarkdown`, `images`, `insert`, `key`, `markdownFromEditor`, `normalizeCopiedMath`, `openFile`, `position`, `refreshMathNow`, `renderLooseMath`, `renderRaw`, `renderSplitDisplayMath`, `richOrMarkdown`, `safeHTML`, `save`, `scheduleMathRender`, `setName`, `status`, `updateRawFromVisual`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A07 PDFViewer

- **檔案**：`pdf-viewer.js`
- **輸入**：DOM / module input
- **輸出**：UI / data output
- **主要函式（靜態擷取，非完整 call graph）**：`finish`, `hide`, `show`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A08 CloudClient

- **檔案**：`cloud.js`
- **輸入**：使用者操作、雲端 API JSON
- **輸出**：雲端 UI 與文件資料
- **主要函式（靜態擷取，非完整 call graph）**：`$`, `api`, `apiUrl`, `base64ToBytes`, `buildIncremental`, `bytesToBase64`, `closeCloudMenu`, `download`, `el`, `getCloud`, `history`, `life`, `localSnapshot`, `positionCloudMenu`, `progress`, `readHashId`, `readHashInfo`, `removeFile`, `renderFiles`, `run`, `saveBlob`, `shaBytes`, `show`, `showCreatePanel`, `updateCommitButton`, `upsert`, `validId`, `walk`, `writeHashId`, `zipFolder`, `zipManifest`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A09 AIChatManager

- **檔案**：`ai-chat-ui.js`
- **輸入**：匯入聊天、使用者提示、API 回應
- **輸出**：QA 區塊、聊天列表
- **主要函式（靜態擷取，非完整 call graph）**：`$`, `back`, `createChat`, `current`, `deleteBlock`, `download`, `enter`, `exportMarkdown`, `hideContext`, `notice`, `numberFor`, `persist`, `positionMenu`, `renderMarkdown`, `renderThread`, `renderTree`, `reorder`, `saveBeforeSwitch`, `send`, `showContext`, `sidebar`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A10 BYOKProxy

- **檔案**：`ai-byok-worker/worker.js`
- **輸入**：POST /ai/responses、使用者 API Key
- **輸出**：上游 Responses API JSON / 錯誤
- **主要函式（靜態擷取，非完整 call graph）**：`reply`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。


## A11 CloudAPI

- **檔案**：`cloud-worker/worker.js`
- **輸入**：HTTP API、Neon 連線
- **輸出**：雲端文件/版本/專案 JSON
- **主要函式（靜態擷取，非完整 call graph）**：`hex`, `lifeDays`, `reply`, `safe`, `uuid`
- **錯誤界線**：維持原程式錯誤處理，對外 API 不暴露內部憑證與資料庫字串。
- **相依性**：請參考 `DataFlow.md`。
