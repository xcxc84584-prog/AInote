# BV-Note v3.5.16｜Version Log

Date: 2026-10-21

## Added
- 網站 AI 模式支援文字型附件 5 MiB 分片上傳，最多 10 份附件。
- 每個成功且唯一的分片扣除當日網站 AI 額度 1 次；相同 upload ID/part index 重試不重複扣額度。
- Neon `bv_ai_chunks` 資料表保存分片資訊；Cloudflare R2 `AI_UPLOADS` 暫存分片。
- 新增 `/api/ai/chunk`，使用登入 Bearer Token 驗證分片歸屬。
- 每小時排程清理超過 24 小時的暫存分片與資料庫紀錄。
- 更新頁面版本與 `ai-chat-ui.js` cache-busting 至 3.5.16。

## Changed
- 前端單檔選取上限 100 MiB；解壓文字上限 32 MiB；最多 10 個附件。
- 網站 AI 的一般聊天仍會額外扣除 1 次；分片計費與聊天計費分開。
- 個人 API Key 模式不扣網站額度，仍維持 BYOK Worker 12 MB HTTP body 限制。

## Known limitations (important)
- **網站 AI 只會讀取每個附件前 24,000 字元作為預覽**，不會完整分析大型文件；不應宣稱全檔已供 AI 讀取。
- 網站模式僅支援可解析的文字／程式碼／ZIP／DOCX／PPTX／XLSX；圖片和 PDF 暫不支援網站分片解析。
- Office 解析只提取部分 XML 文字，不保證表格關係、圖像、公式完整保留。
- ZIP 解壓受 100 項、32 MiB 文字限制；不支援舊 DOC/PPT/XLS。
- 分片一旦成功儲存即消耗額度，即使稍後聊天失敗或取消，也不自動退還；重試同一分片不重扣。
- 若上傳中斷，前端尚未保存 upload ID 以供跨頁恢復；已成功分片依規則扣額度。
- 分片額度扣除與 R2 儲存跨系統，極端故障時可能需要人工對帳。
- 需要先建立 R2 bucket、執行 Neon migration，再部署 Worker 和前端。
