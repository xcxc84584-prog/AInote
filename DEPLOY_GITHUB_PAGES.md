# AInote v1.5.2 — GitHub Pages 部署

## 操作
1. 在 GitHub 建立一個 **Public** repository（例如 `ainote`）。
2. 進入 repository → **Add file** → **Upload files**。
3. 將本壓縮檔解壓後，**所有根目錄檔案與 `AS-CODE-P` 資料夾**上傳至 repository 根目錄（不要多包一層資料夾）。
4. 按 **Commit changes**。
5. 進入 **Settings → Pages**，在 **Build and deployment** 設定 **Source: Deploy from a branch**、**Branch: main**、**Folder: / (root)**，再按 **Save**。
6. 等待 GitHub Pages 發布。網址通常為 `https://<帳號>.github.io/<repository>/`。

## 注意
- 本網站為純靜態前端，保留原始 `index.html`、`style.css`、`app.js`、`renderer.js`。
- 公式及 Markdown 等部分渲染函式庫透過 jsDelivr CDN 載入，使用時需要網路。
- 網站沒有雲端帳號或伺服器端文件同步；請使用網站原本的開啟、儲存、另存功能管理文件。
- `.nojekyll` 用於避免 GitHub Pages 的 Jekyll 處理干擾靜態資源。
