# AREA list

BV-Note v2.4.5 · sEAPP v1.2

| AREA ID | 名稱 | 輸入 | 輸出 | 功能 |
|---|---|---|---|---|
| A1 | Markdown 編輯與狀態 | 使用者輸入 | 原始 Markdown | 編輯內容及未儲存狀態 |
| A2 | 文件渲染 | 原始 Markdown | 瀏覽 HTML | 安全 HTML 與顯示 |
| A3 | 數學式處理 | LaTeX | MathML/HTML | 數學定界符與公式渲染 |
| A4 | 貼上及圖片輸入 | 剪貼簿 | Markdown/圖片 | 貼上文字與圖片 |
| A5 | 本地文件開啟儲存 | File/Handle | Markdown/檔案 | 讀寫原始文件 |
| A6 | Explorer 掃描顯示 | Root Handle | 檔案樹 | 掃描資料夾及顯示樹 |
| A7 | Explorer 節點管理 | 節點操作 | 更新後樹 | 新增、刪除、重新命名及移動 |
| A8 | UUID 與記錄持久化 | Root/UUID/紀錄 | JSON | 節點 ID 與目錄紀錄保存 |
| A9 | 目錄化管理 | 框選文字/紀錄 | 目錄清單 | 新增、定位、刪除目錄 |
| A10 | 文本工具 | 選取區間/操作 | 更新後 Markdown | 插入與刪除選取文本 |
| A11 | 圖片插入 | 圖片/游標 | Markdown 圖片 | 在指定位置插圖 |
| A12 | 匯入文件 | File/目的 Fold | 新文件 | 複製檔案到 Explorer |
| A13 | ZIP 匯出 | File/Fold | ZIP Blob | 封裝所選文件或資料夾 |
| A14 | Mermaid 圖形化 | Mermaid 程式碼 | SVG | 預先檢查語法並渲染 Mermaid，失敗時顯示原碼 |
| A15 | Explorer 模式及工作階段 | 模式/UUID | UI 狀態 | 編輯與瀏覽切換及狀態恢復 |
| A16 | 表格與介面排版 | HTML/視窗 | 可捲動 UI | 表格橫向捲動及響應式排版 |
| A17 | 工具列與功能選單 | UI 事件 | 操作請求 | 設定、文件與目錄入口 |

> AREA 是功能邊界；表內不宣稱每個 AREA 都有獨立 JS 模組。
