# BV-Note v3.9.7 — AI Refactor S3/S4/S5

| 序列 | 新增功能 | 變更範圍 |
|---|---|---|
| 3 | ChatGPT conversations.json/ZIP/Markdown 匯入、Catalog 與按需載入、保留父子訊息關係、去重 | ai-import/*、AI 側欄獨立預覽入口 |
| 4 | 5 MiB 本地分片、SHA-256、Manifest、IndexedDB staging、重組校驗與清理 API | ai-transfer/* |
| 5 | 驗證實際上傳 bytes + SHA-256、冪等配額登記、100 次/日鎖定、追蹤日誌 | ai-transfer-api.js、SQL migration |
| Console | `/log <x>`、`/log <x><target>`；新增六個 `/test` targets | console-api.js、database-flow-commands.js |

## 限制與兼容

- S3 匯入先進獨立 IndexedDB，**不直接合併既有聊天**。聊天主流程切換留待後續序列。
- S4 預設**完全本地**，不會因切片而呼叫網路或扣額度。
- S5 `/api/ai/verified-part` 為明確選擇的驗證上傳路由：Worker 收到真實 bytes、核對 SHA256，**立即丟棄內容，不保存也不提供 AI 分析**，但每個首次有效分片按現行網站額度扣 1 次。**不應在未告知使用者此行為前自動呼叫。**
- 舊 `/api/ai/chunk` manifest-only 路由保留以避免破壞現有聊天；它仍無法驗證實際內容，**不得當作安全的上傳證明**。後續序列應遷移停用。
- 未更動 NOTE/Explorer/Cloud、既有聊天儲存及 PowerShell 權限。
- Worker 會將驗證上傳的 trace_id 與測試結果摘要寫入 /log；不記錄附件本文。
- ZIP 需先套用 S0-S2，且部署前需執行 Neon migration。
- 此補丁未經正式環境端到端測試。
