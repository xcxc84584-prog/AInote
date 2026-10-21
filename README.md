# BV-Note v3.5.16 Local｜無 R2 瀏覽器分片版

## 架構
- 不需 Cloudflare R2、Durable Objects，也不會上傳完整附件到網站 Worker。
- 網站模式：瀏覽器本地提取文字，依 **提取後 UTF-8 位元組**每 5 MiB 切片並計算 SHA-256；每片只傳 JSON 中繼資料供 Neon 記錄及每日配額扣除。
- 每個成功登記的新分片扣 1 次（相同 upload_id + part_index 重試不重複扣除），成功的 AI 聊天另扣 1 次。
- **只有每份附件前 3,500 字元**會被送至網站 AI；其餘內容留在瀏覽器，不是全文分析。圖片及 PDF 在網站模式尚未支援解析。
- 個人 BYOK 模式維持原本行為，不使用網站額度，仍受 OpenAI/代理限制。
- 單檔選取最多 100 MiB、單次最多 10 個附件；ZIP 解壓與可讀取文字仍有額外限制。

## 部署
1. 既有 Neon 遷移 `cloud-worker/migrate_v3_5_16_chunks.sql` 已執行則不用重跑。
2. **不建立 R2 Bucket**。`cloud-worker/wrangler.toml` 已移除 R2 binding。
3. 部署 `cloud-worker`：`npm install`，`npx wrangler deploy`。
4. 將前端 `index.html`、`ai-chat-ui.js` 和版控文件提交 GitHub Pages。
5. 測試小 TXT（分片登記 1 + AI 聊天 1，共 2 次）；6 MiB 可讀取文字（2 + 1，共 3 次），以及重複登記不重扣。

## 注意
這是 **本地處理分片並按片計費**，不是將完整檔案上傳給模型。分片計數根據用戶端申報大小，伺服器不能驗證原始內容；適合作為自訂額度規則，但不能作為可信的實際檔案傳輸證明。額度耗盡時未完成的登記不收費；已成功登記的分片即使最後聊天失敗仍不退款。若需全文大型文件分析，需要另一套串流處理／檢索架構。
