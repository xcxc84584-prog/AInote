# BEHAVIOR List｜可觀察行為

| ID | 行為 | 入口 | 期望結果 | 失敗處理 |
|---|---|---|---|---|
| B01 | 編輯 Markdown | 編輯器輸入 | 原文保持可存取、預覽更新 | 保留原文並提示 |
| B02 | 解析與渲染 | Markdown Renderer | Markdown / KaTeX / SVG / Mermaid 顯示 | 隔離錯誤並提示 |
| B03 | 本地 Explorer | 開啟 Root / Fold / File | 檔案清單及內容同步 | 不覆蓋既有資料 |
| B04 | 目錄與標註 | 文字選取/目錄操作 | 更新標記及備註 | 保留文件狀態 |
| B05 | AI Chat 管理 | 匯入/選取聊天 | QA 區塊可編輯下載 | 錯誤顯示，不洩漏 Key |
| B06 | BYOK API | POST /ai/responses | 轉發 Responses API 回應 | CORS/Schema/502 處理 |
| B07 | 雲端文件 | Cloud UI | 建立/搜尋/下載/提交/刪除 | 409 衝突與錯誤提示 |
| B08 | 過期清理 | Worker Cron | 清理到期文件 | 平台日誌記錄非敏感錯誤 |
