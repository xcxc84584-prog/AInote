# Version Log — BV-Note v3.5.16 Local (2026-10-21)

- 移除 Cloudflare R2 依賴與 Worker R2 綁定。
- 附件於瀏覽器本地提取與 5 MiB 分片，SHA-256 只用於本地摘要，Worker 只收分片中繼資料。
- Neon `bv_ai_chunks` 記錄分片；每個新分片扣 1 次每日網站額度；重試不重扣。
- AI 請求另扣 1 次；個人 API Key 不扣網站額度。
- 每附件僅傳送前 3,500 字元預覽給模型；非全文分析。
- 修正部署說明，不再要求建立 R2。
