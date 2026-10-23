# BV-Note v3.0.4｜逐步部署（使用者只需 File Hash ID）

## 1. Neon
1. 登入 https://console.neon.tech 建立免費專案。
2. 進入 SQL Editor，執行 `cloud-worker/schema.sql`（已建立 v3 資料表則不必重建）。
3. 複製 Neon PostgreSQL 連線字串，**不要寫入前端或 GitHub**。

## 2. Cloudflare Worker
1. 安裝 Node.js，終端機進入 `cloud-worker/`。
2. 執行 `npm install`、`npx wrangler login`。
3. 修改 `wrangler.toml` 的 `ALLOWED_ORIGIN` 為實際網站來源（例如 `https://USERNAME.github.io`，不含 `/AInote/`）。
4. 執行 `npx wrangler secret put DATABASE_URL`，貼上 Neon 連線字串。
5. 執行 `npm run deploy`，複製部署後顯示的 `https://...workers.dev` 網址。若 Worker 尚不存在而無法設定 Secret，可先部署一次、再設定 Secret 並重新部署。
6. 不需要 `CLOUD_ACCESS_TOKEN`。

## 3. 設定前端 API URL（**只需部署者設定一次**）
1. 用文字編輯器開啟網站根目錄 `cloud-config.js`。
2. 把 `https://REPLACE-WITH-YOUR-WORKER.workers.dev` 換成上一步取得的完整 Worker HTTPS 網址，保留引號。
3. `cloud-config.js` 是公開設定檔，只能放 API 公開網址，**不能放 DATABASE_URL、Token 或其他密碼**。
4. 修改後上傳 GitHub Pages；一般使用者看不到 Cloud API URL 輸入欄位。

## 4. GitHub Pages
1. 將網站根目錄 HTML、CSS、JS（包含 `cloud-config.js`）推送至 `AInote` 倉庫。
2. GitHub → Settings → Pages → Deploy from a branch → main → /(root)。
3. 打開網站，在 Explorer 旁按「☁ 雲端」，直接輸入完整 File Hash ID 搜尋。
4. 建立雲端專案仍須先選取本地已保存文件；上傳成功後記錄其 File Hash ID。

## 5. 本地與雲端隔離
- 本地檔案操作只在使用者授權的 Explorer 中執行；雲端 API 不可讀取本地資料夾。
- 雲端導入會新增本地文件，不覆蓋現有文件。
- 若顯示「網站尚未設定 Cloud API URL」，由部署者檢查 `cloud-config.js`，不是要求一般使用者輸入 URL。
- File Hash ID 即存取憑證：任何知道 ID 的人都可能讀取、提交及永久刪除對應雲端文件；請勿用於敏感資料。
- CORS 並非認證，無法阻止直接 HTTP 請求。

## v3.0.4 雲端「其它功能」選單

雲端右上角「其它功能」採用與編輯頁面「設定」相同的浮動下拉選單樣式及定位機制，點擊外部、Escape 或切換頁面時關閉。原有導入及 ZIP 下載操作保留；本地 Explorer 不變。
