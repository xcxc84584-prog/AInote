# AREA list｜BV-Note v3.0.3

## 舊版 A1–A17（沿用功能；依現有原始碼整理）

> 舊版 sEAPP 僅以 A1–A17 合併描述，沒有提供各個 ID 的正式名稱。以下是依 v3.0.1 實際程式碼所作的**補充性功能拆分**，並非聲稱舊版原本就使用這些名稱。

| AREA ID | 名稱 | 輸入 | 輸出 | 功能 |
|---|---|---|---|---|
| A1 | MarkdownSource | 使用者輸入／開啟檔案 | rawMarkdown | 保留 Markdown 原始碼與換行 |
| A2 | MarkdownRenderer | rawMarkdown | HTML | Markdown 解析、GFM 表格 |
| A3 | MathRenderer | LaTeX | HTML | KaTeX 行內／區塊公式與重新渲染 |
| A4 | SVGRenderer | SVG / data URL | SVG HTML | SVG 顯示與淨化 |
| A5 | MermaidRenderer | mermaid code | SVG／錯誤提示 | Mermaid 語法驗證與渲染 |
| A6 | ImagePaste | Clipboard image | data URL | 貼上圖片與 Markdown 插入 |
| A7 | EditorMode | Edit/View | Mode | 編輯／瀏覽模式切換 |
| A8 | LocalFileIO | File Handle | Markdown | 本地讀取／儲存 |
| A9 | ExplorerTree | Root Handle | Tree | 本地 Root／Fold／File 展示 |
| A10 | ExplorerMutation | Node Operation | Updated Tree | 建立、重新命名、移動、刪除 |
| A11 | ExplorerIdentity | File Path | UUID | UUID 與節點路徑紀錄 |
| A12 | ExplorerBatch | Selected Nodes | Batch Result | 批次選取／操作 |
| A13 | ExplorerZIP | Node | ZIP | 本地 ZIP 匯出 |
| A14 | ExplorerSession | Current State | Restored State | 閱讀位置、展開狀態與工作階段 |
| A15 | TOCManager | Selection | TOC | 目錄化、定位、編輯、刪除 |
| A16 | TextTools | Selection | Updated Markdown | 插入／刪除文本、插入圖片 |
| A17 | UIState | User Actions | Status/UI | 工具列、狀態提示與儲存提示 |

## v3 雲端 A18–A34

| AREA ID | 名稱 | 輸入 | 輸出 | 功能 |
|---|---|---|---|---|
| A18 | PageSwitcher | Explorer Cloud Button | ActivePage | 保留 Explorer 並切換主區域與頂部工具列 |
| A19 | CloudPageUI | API Result | Cloud UI | 搜尋、表格、歷史、雲端操作 |
| A20 | CloudProjectCreator | Selected Local File | Project ID | 建立單檔雲端專案 |
| A21 | FileIdentity | Existing UUID | File Hash ID | 沿用本地 UUID；非內容 SHA256 |
| A22 | ZIPManager | Selected Cloud File | ZIP | 單檔 ZIP，不列出其他文件 |
| A23 | CloudAPIClient | 預設 HTTPS URL / Request | API JSON | 由部署者設定 cloud-config.js；不使用 Token |
| A24 | CloudProjectRegistry | Project Name | Project Record | Neon 專案資料表 |
| A25 | CloudCommitManager | File ID / Content / Revision | New Revision | 完整或未變更略過式提交 |
| A26 | VersionComparator | SHA256 / Revision | Change / Conflict | 409 版本衝突 |
| A27 | CloudSearch | Exact File Hash ID | File Metadata | 精確 UUID 搜尋，不允許名稱／列舉 |
| A28 | CloudFileTable | Searched Files | Table | 僅顯示本次已搜尋文件 |
| A29 | CommitHistory | File Hash ID | Revision List | 歷史版本與下載 |
| A30 | CloudDownload | File Hash ID / Revision | Markdown | 單檔下載 |
| A31 | CloudImport | Cloud Markdown | New Local File | 導入 Root，避免覆蓋 |
| A32 | CloudDelete | File Hash ID | Delete Result | 永久刪除雲端文件與所有提交紀錄 |
| A33 | IDCapability | File Hash ID | Access Decision | 知道 ID 即可讀寫刪；無獨立認證 |
| A34 | CloudErrorTrace | API Error | UI Status / Worker Log | 錯誤提示、後端紀錄 |

## 相容與隔離約束

- A1–A17 為本地功能，僅使用瀏覽器本地 File System Access API，不直接呼叫 Neon。
- A18–A34 雲端操作透過 Cloudflare Worker；前端不接觸 DATABASE_URL。
- A21 之 File Hash ID 是 UUID 身分識別碼，不是檔案內容雜湊；內容雜湊另用 SHA-256。
- A33 的 ID 即權限模式無法撤銷單一持有者；任何取得 ID 者可讀、寫、刪除。
- 目前建立專案僅支援單一 File；不是 Fold 批次同步。
- 目前增量更新是 SHA-256 無變更時跳過，變更時仍儲存完整內容。

## v3.0.4 介面調整

雲端操作 UI AREA 改為浮動選單，沿用原有設定選單的定位、展開、收合、視窗邊界及響應式風格；雲端導入與 ZIP 下載 AREA 的執行邏輯不變。
