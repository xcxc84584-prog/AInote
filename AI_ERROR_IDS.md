# BV-Note AI Chat 診斷版錯誤 ID

| ID | 意義 | 建議檢查 |
|---|---|---|
| AI-CFG-001 | OPENAI_API_KEY 未設定 | Wrangler Secret 名稱 |
| AI-REQ-001～004 | 請求格式、大小或讀取錯誤 | 前端 payload |
| AI-DB-001 | AI 額度預留失敗 | Neon bv_ai_usage 表 |
| AI-DB-002 | AI 額度回滾失敗 | Neon 連線及資料庫日誌 |
| AI-LIMIT-001 | 每日額度已滿 | 今日使用量 |
| AI-WK-502 | fetch 上游連線例外 | Worker tail；OpenAI 連線 |
| AI-WK-503 | 上游回應讀取例外 | Worker tail |
| AI-WK-500 | Worker 其他 AI 例外 | Worker tail |
| AI-UP-401/429/500 等 | OpenAI HTTP 回應狀態 | API Key、額度、模型及服務狀態 |
| AI-FE-HTTP-xxx | 前端收到未分類 HTTP 錯誤 | Network 回應內容 |

TraceID 為單次請求 UUID；可用來比對 Worker tail 的 BV_AI_DIAGNOSTIC 日誌。日誌只記錄階段、錯誤類別、狀態與上游錯誤代號，不記錄金鑰、Token 或對話內容。

## 部署

1. 備份目前的網站及 cloud-worker 目錄。
2. 將 ZIP 解壓至專案根目錄，保留既有 Worker Secrets，不要刪除 Worker。
3. `cd .\cloud-worker`
4. `npm install`（若 node_modules 已存在可略過）
5. `node --check auth.js` 和 `node --check worker.js`
6. `.\node_modules\.bin\wrangler.cmd deploy --config wrangler.toml`
7. 提交網站前端更新：`git add ai-chat-ui.js AI_ERROR_IDS.md`、`git commit -m "AI chat error diagnostics"`、`git push origin main`。請先確認 Git 遠端指向預期的網站。
8. 用 `wrangler tail` 監控並重新測試 AI Chat。

注意：這是診斷強化，不保證修復真正的 502 原因。若出現 AI-WK-502，提供 ErrorID 與 TraceID，勿貼出 API Key。
