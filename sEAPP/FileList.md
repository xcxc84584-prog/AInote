# FileList｜BV-Note v3.0.3

FileList 使用專案根目錄相對路徑。下表均為**實際存在的檔案**，同一 AREA 可以跨多個文件。

| File Path | AREA | 實作位置說明 |
|---|---|---|
| `index.html` | A7,A17,A18,A19 | 共用頂部與兩頁容器 |
| `style.css` | A2,A3,A4,A5,A9,A15,A17,A19,A28 | 舊版與雲端版面樣式 |
| `app.js` | A1,A2,A3,A4,A6,A7,A8,A16,A17 | Markdown 編輯、渲染與本地存取 |
| `renderer.js` | A2,A3,A4,A5 | Markdown／數學式／Mermaid 原始碼保護 |
| `mermaid-support.js` | A5 | Mermaid 安全渲染 |
| `explorer.js` | A8,A9,A10,A11,A12,A13,A14,A21,A31 | 本地 Explorer 與 UUID、雲端匯入橋接 |
| `toc.js` | A15,A16 | 目錄與文本工具 |
| `cloud.js` | A18,A19,A20,A21,A22,A23,A25,A27,A28,A29,A30,A31,A32,A34 | 雲端頁面與 API 客戶端 |
| `cloud-worker/worker.js` | A23,A24,A25,A26,A27,A29,A30,A32,A33,A34 | API、Neon SQL、ID 權限 |
| `cloud-worker/schema.sql` | A24,A25,A29,A32 | 資料表與刪除級聯 |
| `cloud-worker/wrangler.toml` | A23,A34 | Worker 部署與 CORS Origin |
| `cloud-worker/package.json` | A23 | Worker 依賴 |

## v3.0.3 新增配置

| File Path | AREA | 說明 |
|---|---|---|
| cloud-config.js | A23 | 部署者預先設定 Cloud API URL；不得保存密碼 |

## v3.0.4 實作文件補充

| File Path | 變更 |
|---|---|
| index.html | 將其它功能面板移為浮動選單，保留原按鈕 ID |
| cloud.js | 增加選單定位、外部點擊、Escape、頁面切換收合 |
| style.css | 沿用編輯設定選單的視覺規格 |
