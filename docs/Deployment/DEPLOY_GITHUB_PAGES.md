# BV-Note v3.0.3｜GitHub Pages 部署

1. 先依 `DEPLOY_V3_STEP_BY_STEP.md` 部署 Neon 與 Cloudflare Worker。
2. 編輯 `cloud-config.js`，將 `BV_CLOUD_API_URL` 設為 Worker HTTPS 網址。
3. 將前端檔案（包含 `cloud-config.js`）推送至 GitHub 倉庫根目錄。
4. GitHub → Settings → Pages → Deploy from a branch → main → /(root)。
5. 開啟網站，點 Explorer 旁「☁ 雲端」，輸入 File Hash ID。

注意：`cloud-config.js` 會公開，不能存放 Neon 連線字串、Token 或任何秘密。
