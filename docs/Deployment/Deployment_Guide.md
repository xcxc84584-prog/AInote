# 部署指南（GitHub Pages + Cloudflare Workers + Neon）

## 1. 靜態網站

將 ZIP 根目錄（包含 `index.html`）上傳至新的 GitHub Repository，Settings → Pages → Deploy from a branch → main → /(root)。`.nojekyll` 必須保留。若網站部署於 `/repo-name/`，靜態相對路徑可沿用；Worker CORS Origin 只填 `https://username.github.io`，不要填路徑。

## 2. Neon

先備份資料庫。新資料庫依 `cloud-worker/schema.sql` 初始化；已存在的資料庫不可直接重跑初始化或刪表。依實際版本檢查 migration。

## 3. Cloud Worker

```powershell
cd cloud-worker
npm install
# 編輯 wrangler.toml 的 name 與 ALLOWED_ORIGIN
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler deploy
```

複製部署後的 Worker HTTPS URL 至根目錄 `cloud-config.js`。

## 4. BYOK Worker

```powershell
cd ai-byok-worker
npm install
# 編輯 wrangler.toml 的 name 與 ALLOWED_ORIGINS
npx wrangler deploy
```

確認 AI Chat UI 使用的 BYOK URL；不要在 GitHub Repository 放入個人 API Key。

## 5. 驗證

依 `sEAPP/STEP_List.md` 測試。Cloud Worker 的 `/api/health` 僅代表服務有回應，不等於 Neon 寫入、權限與 BYOK 已通過。正式切換前需實測完整建立、提交、下載與衝突流程。

**本 ZIP 是部署候選包，不代表已經線上發布。**
