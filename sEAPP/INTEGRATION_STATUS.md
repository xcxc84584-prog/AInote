# sEAPP v3.9.0 coverage and limitations
- 基準：使用者上傳 v3.8.9.4 專案。GitHub main tree SHA: 95fb15a48f9291f72b1d2284c7114a6ff9cdd0e9（已讀取檔案樹，未下載/逐檔合併 GitHub 差異）。
- 全站 JavaScript 函數 AST 標註：527 BLOCK，23 個檔案級 AREA；採註解方式，保留原有邏輯。
- 新增：前端全域 exception / unhandledrejection、Worker 未處理例外、登入後日誌寫入與查詢、/log UI。
- 不代表所有函數都具備執行期輸入輸出追蹤；BLOCK 標註是靜態架構覆蓋，未建立完整函數調用圖。
- AI BYOK Worker 的內部異常仍由原 Cloudflare runtime logs 管理，尚未自動同步至 Neon。
- Server-side uncaught errors 若未能關聯 user_id，僅留資料庫供管理員查看，普通使用者不可查詢。
- 尚未進行真實 Neon migration、Cloudflare deploy、端對端測試。請先在測試環境驗證。
