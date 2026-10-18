# Behavior list｜BV-Note v3.0.3

Behavior = Condition → Action。B1–B30 是依舊版功能及 v3 新規則完整整理，重新統一編號，舊版 v3.0.1 的 B17/B18 曾重複編號，本版已消除。

| Behavior ID | Condition | Action |
|---|---|---|
| B1 | 開啟編輯頁 | 顯示原本 Edit/目錄/另存/新文件/設定，隱藏雲端 Commit |
| B2 | 開啟雲端頁 | 只顯示雲端 Commit／建立新雲端專案／其它功能 |
| B3 | 切換頁面 | 共用 Explorer，不清除本地未儲存內容 |
| B4 | 點 Explorer File | 返回文件編輯頁面並載入所選文件 |
| B5 | 本地沒有 Root 或選定 File | 拒絕建立專案及 Commit |
| B6 | 本地文件未儲存 | 拒絕雲端上傳，提示先本地 Commit |
| B7 | API URL 非 HTTPS | 拒絕連線 |
| B8 | API Origin 不符 ALLOWED_ORIGIN | 拒絕跨站瀏覽器請求；Origin 非身份認證 |
| B9 | 搜尋欄非完整 UUID | 拒絕搜尋 |
| B10 | 輸入有效 File Hash ID | 只讀取該 ID 對應文件的中繼資料 |
| B11 | File Hash ID 不存在 | 回傳 404，不顯示其他文件 |
| B12 | 使用者未輸入 ID | 不顯示雲端全站清單 |
| B13 | 已取得 ID 的使用者 | 可讀取／提交／下載／永久刪除該文件 |
| B14 | 建立新雲端專案 | 使用本地文件 UUID 上傳首個版本 |
| B15 | 檔案內容超過 1 MiB | 後端拒絕 |
| B16 | 雲端 Commit 前 | 確認本地檔案已保存 |
| B17 | 雲端 base_revision 過期 | 回傳 409，不覆蓋其他版本 |
| B18 | 增量模式內容 SHA256 相同 | 不新增版本 |
| B19 | 內容變更或完整模式 | 新增完整內容版本並記錄時間 |
| B20 | 查詢 Commit History | 列出指定 ID 的版本歷史 |
| B21 | 下載指定版本 | 只下載檔案，不覆蓋本地 |
| B22 | 雲端導入 | 建立新本地文件並避免同名覆蓋 |
| B23 | 刪除雲端文件 | 確認後永久刪除檔案與全部歷史，不影響本地 |
| B24 | 雲端 ZIP | 只打包指定 File Hash ID 的最新版本 |
| B25 | Worker 缺 DATABASE_URL | 回傳服務設定錯誤 |
| B26 | Worker 收到其他文件 ID | 不回傳該 ID 以外的內容 |
| B27 | Markdown 解析失敗 | 保留原始 Markdown，顯示錯誤或原始碼 |
| B28 | Mermaid 語法錯誤 | 顯示原始碼／錯誤提示，不顯示大型錯誤圖 |
| B29 | 本地 Explorer 更名或移動 | 保留節點 UUID 與相關紀錄 |
| B30 | 同名文件導入 | 避免覆蓋本地既有檔案 |

## v3.0.3 行為補充

| Behavior ID | Condition | Action |
|---|---|---|
| B31 | 一般使用者進入雲端頁面 | 不顯示 Cloud API URL 輸入欄位；只顯示 File Hash ID 搜尋等操作 |
| B32 | cloud-config.js 尚未設定有效 Worker HTTPS URL | 顯示部署者設定提示，禁止發送錯誤 API 請求 |
| B33 | 部署者已設定 Worker HTTPS URL | 前端自動使用預設 API 網址，無需使用者手動連線 |

## v3.0.4 雲端選單補充

| Behavior ID | Condition | Action |
|---|---|---|
| B31 | 在雲端頁面點擊「其它功能」 | 在按鈕旁展開與編輯「設定」同風格的浮動選單 |
| B32 | 點擊選單外部、Escape、選單操作或切換頁面 | 關閉選單並重設 aria-expanded |
