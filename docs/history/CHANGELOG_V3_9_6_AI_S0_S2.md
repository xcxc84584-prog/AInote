# BV-Note v3.9.6 | AI Chat 重構序列 0、1、2

> 2026-10-24；僅增量補丁，非整站重置。正式版號部署前須確認 `main` 尚未使用 v3.9.6。

| 序列 | 本次交付 | 啟用狀態 | 回滾 |
|---|---|---|---|
| 0 | 基準驗證、受控測試命令 `/test help`、AI 測試註冊、`/log` 測試摘要 | 測試命令部署後可用，管理員限定 | 還原 Worker 修改 |
| 1 | AI v2 feature flags / adapter 隔離入口 | `chatEngineV2=false`，舊聊天繼續運作 | 移除新 script 引用 |
| 2 | IndexedDB 獨立資料模型與 legacy-copy 工具 | 預設不遷移；手動呼叫 `BV_AI_STORAGE_V2.copyLegacy()` 才複製 | 停用新模組；原 localStorage 保留 |

## 安全與範圍
- 未啟用 GPT-5、串流、RAG 或新版傳輸；這些屬後續序列。
- 未修改 NOTE、Explorer、Cloud、帳號驗證邏輯。
- `/test` 不執行任意輸入程式碼、不寫入使用者檔案；僅允許預先註冊的純函式。
- `/log` 只儲存管理員測試摘要；不記錄附件內容、API Key、完整對話。
- `/test help` 需要管理員登入，列出允許的 target、說明及語法。
- `ai-chunk-boundary` 僅驗證 5 MiB 分片邊界演算法，不代表完成真實附件傳輸或伺服器計費測試。

## 預期測試

| 命令 | 預期 |
|---|---|
| `/test help` | 顯示 `add`、`ai-schema`、`ai-chunk-boundary`、`ai-message-order` |
| `/test <ai-schema><20>` | Passed: 20 / Failed: 0 |
| `/test <ai-chunk-boundary><30>` | Passed: 30 / Failed: 0 |
| `/test <ai-message-order><20>` | Passed: 20 / Failed: 0 |
| `/log` | `TEST_RUN` 紀錄及失敗樣本（若有） |

## 已知限制
- 瀏覽器 IndexedDB 需在 BV-Note 頁面自行驗證，Worker `/test` 無法直接測試使用者瀏覽器儲存。
- 本次不切換舊 AI 資料寫入路徑。`copyLegacy()` 為明確手動操作，重複執行對相同 ID 覆寫副本，不刪舊資料。
- 如果 GitHub 最新主線已更新相同檔案，安裝程式會檢查錨點，找不到時停止，不強制覆蓋。
