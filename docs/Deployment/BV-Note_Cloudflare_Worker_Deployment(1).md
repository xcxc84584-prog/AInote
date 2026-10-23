# BV-Note v3.5.12｜Cloudflare Worker 部署教學

> 適用：Windows PowerShell、GitHub Pages `https://xcxc84584-prog.github.io/BVnote2/`、新 Neon PostgreSQL 資料庫。  
> 依據：BV-Note v3.5.12 ZIP 內的 `cloud-worker/worker.js`、`wrangler.toml`、`package.json`。  
> 注意：此文件部署的是**雲端文件 Worker**，不是獨立的 `ai-byok-worker`。

## 1. 系統架構

```text
Browser
  │
  ▼
GitHub Pages (BVnote2)
  │ HTTPS /api/...
  ▼
Cloudflare Worker (bv-note2-cloud)
  │ DATABASE_URL（Secret）
  ▼
Neon PostgreSQL (neondb)
  ├── projects
  ├── cloud_files
  └── commits
```

GitHub Pages 不能直接安全地儲存資料庫密碼，因此資料庫只由 Worker 連線。請勿把 `DATABASE_URL` 寫入 `cloud-config.js`、GitHub 或其他公開前端檔案。

## 2. 前置條件

- 已建立 GitHub Repository `BVnote2`，並啟用 GitHub Pages。
- 已建立 Neon 資料庫及 `projects`、`cloud_files`、`commits` 三張表。
- 電腦已安裝 Node.js、npm，可使用 PowerShell。
- 已有 Cloudflare 帳號。
- 專案根目錄包含 `cloud-worker/` 與 `cloud-config.js`。

## 3. 開啟 Worker 資料夾

在檔案總管開啟本地 BV-Note 專案根目錄，在網址列輸入 `powershell` 並按 Enter。接著執行：

```powershell
cd .\cloud-worker
Get-ChildItem
```

確認包含 `worker.js`、`wrangler.toml`、`package.json`。

## 4. 修改 wrangler.toml

將 `cloud-worker/wrangler.toml` 設為：

```toml
name = "bv-note2-cloud"
main = "worker.js"
compatibility_date = "2026-09-01"

[vars]
ALLOWED_ORIGIN = "https://xcxc84584-prog.github.io"

[triggers]
crons = ["0 * * * *"]
```

說明：

- `name`：新的 Worker 名稱，避免覆蓋舊的 `bv-note-cloud`。
- `main`：Worker 入口檔。
- `ALLOWED_ORIGIN`：瀏覽器來源只有協定、主機與埠，**不包含** `/BVnote2/` 路徑。
- `crons`：每小時觸發過期文件清理；實際行為取決於 `worker.js`。
- Worker 名稱若已被使用，需改成自己 Cloudflare 帳號下可用的名稱。

## 5. 安裝與登入

```powershell
node -v
npm -v
npm install
npx wrangler --version
npx wrangler login
npx wrangler whoami
```

`npm install` 會依據專案 `package.json` 安裝 Wrangler、Neon serverless driver、JSZip。瀏覽器跳出 Cloudflare 授權頁面時，完成登入授權。

## 6. 部署 Worker

```powershell
npx wrangler deploy
```

成功後記下實際 URL，格式通常為：

```text
https://bv-note2-cloud.<你的-workers-subdomain>.workers.dev
```

以下以 `<WORKER_URL>` 代表**完整且實際**的 HTTPS Worker URL，不要把尖括號當成真實網址輸入。

## 7. 設定 Neon DATABASE_URL Secret

1. 開啟 https://console.neon.tech/，進入新資料庫專案。
2. 點選 **Connect**，選擇 `neondb` 並複製 PostgreSQL 連線字串（建議使用 Neon 提供的 pooled URL）。
3. 回到 `cloud-worker` 目錄中的 PowerShell：

```powershell
npx wrangler secret put DATABASE_URL
```

在安全提示下貼入連線字串並按 Enter。**不要**將連線字串放在命令列參數、Git Commit 或聊天訊息中。

確認 Secret 名稱：

```powershell
npx wrangler secret list
```

預期包含 `DATABASE_URL`；不會顯示密碼內容。

## 8. 測試 Worker Health API

在瀏覽器開啟：

```text
<WORKER_URL>/api/health
```

預期：

```json
{"ok":true}
```

**限制：** 此專案的 `/api/health` 會檢查 `DATABASE_URL` 是否存在，但不會執行實際資料庫查詢。要驗證 Neon 連線，必須執行下一節的寫入測試。

## 9. 測試 Neon 寫入

PowerShell：

```powershell
$api = "https://實際的Worker網址"
$body = @{ name = "BV-Note2-Deployment-Test" } | ConvertTo-Json
Invoke-RestMethod -Uri "$api/api/projects" -Method Post -ContentType "application/json" -Body $body
```

預期回傳一個 `project_id` UUID。若有 403 錯誤，檢查來源限制；若 500/503，檢查 Worker 日誌、Secret、Neon 資料表及連線字串。測試錯誤時可執行：

```powershell
npx wrangler tail
```

然後重新發送測試請求，觀察日誌。請勿公開含有憑證或私人內容的日誌。

在 Neon SQL Editor 驗證：

```sql
SELECT id, name, created_at
FROM projects
WHERE name = 'BV-Note2-Deployment-Test'
ORDER BY created_at DESC;
```

查到新增的資料列，代表 Worker 已成功寫入 Neon。

## 10. 連接 GitHub Pages

回到專案根目錄，修改 `cloud-config.js`：

```javascript
window.BV_CLOUD_API_URL = "https://實際的Worker網址";
```

不要在 URL 後面附加 `/api/health`，也不要在前端填入 Neon Connection String。

在**專案根目錄**的 PowerShell 執行：

```powershell
git status
git add cloud-config.js cloud-worker/wrangler.toml
git commit -m "Configure BV-Note2 Cloudflare Worker"
git push origin main
```

若 `git status` 顯示本地還有其他必要的修改，應逐一檢查後再決定是否加入。若顯示沒有變更，表示可能已提交，不必強行建立空 Commit。

等待 GitHub Pages 發布更新，開啟：

https://xcxc84584-prog.github.io/BVnote2/

## 11. 網站端整合驗收

1. 開啟 BV-Note2，建立**不敏感**的測試文件。
2. 輸入測試 Markdown 並提交到雲端。
3. 重新整理網頁，從雲端重新載入。
4. 確認文件內容完整，再修改文件並再次提交。
5. 在 Neon SQL Editor 查看文件與版本：

```sql
SELECT f.name, f.revision, f.last_commit,
       COUNT(c.revision) AS commit_count
FROM cloud_files f
LEFT JOIN commits c ON c.file_id = f.file_id
GROUP BY f.file_id, f.name, f.revision, f.last_commit
ORDER BY f.last_commit DESC NULLS LAST;
```

若前端出現 CORS、404、500 或 `Failed to fetch`，請在瀏覽器開發者工具的 Network / Console 檢查請求 URL、狀態碼與回應；在 Worker 端用 `npx wrangler tail` 檢查日誌。

## 12. 常見問題

| 問題 | 排查方向 |
|---|---|
| `wrangler` 無法執行 | 先執行 `npm install`，再用 `npx wrangler ...` |
| 部署到舊 Worker | 檢查 `wrangler.toml` 的 `name` |
| `DATABASE_URL missing` | 執行 `npx wrangler secret list`，確認目前部署目標 |
| Health 成功但寫入失敗 | 檢查 Neon 連線、資料表、角色權限及 Worker 日誌 |
| 網站 CORS 錯誤 | 檢查 `ALLOWED_ORIGIN` 是否為 `https://xcxc84584-prog.github.io` |
| GitHub Pages 仍連舊 API | 檢查 `cloud-config.js`、部署狀態、瀏覽器快取 |
| `git push` 失敗 | 檢查 `git remote -v`、登入授權及分支 |

## 13. 安全與正式上線限制

**非常重要：目前 Worker 的 CORS 檢查不是身分驗證。** 非瀏覽器客戶端可不送 `Origin`，因此不能靠 `ALLOWED_ORIGIN` 防止未授權存取。正式上線、多人使用前，至少應實作：

- 使用者身分驗證與每個專案／文件的伺服器端授權檢查。
- API 請求速率限制、輸入驗證、適當的資源配額。
- 文件識別碼不視為密碼或唯一存取控制。
- 資料庫最小權限、備份、日誌去敏及 Secret 輪替。
- 公開服務前對讀取、寫入、刪除與版本 API 進行權限測試。

本教學先完成**測試環境部署**，不代表目前 API 已適合儲存私人資料或對外提供多人服務。

## 14. 驗收清單

- [ ] 新 Worker 名稱設定正確
- [ ] `npm install` 完成
- [ ] `npx wrangler login` 成功
- [ ] `npx wrangler deploy` 成功
- [ ] `DATABASE_URL` Secret 存在
- [ ] `/api/health` 回傳 `{"ok":true}`
- [ ] `/api/projects` 可新增測試專案
- [ ] Neon 查得到測試資料
- [ ] `cloud-config.js` 指向新 Worker
- [ ] GitHub Pages 已更新
- [ ] 網站雲端文件提交、重新載入與版本更新成功

---

**部署完成標準：** GitHub Pages 可透過新 Cloudflare Worker 正常儲存與讀取 Neon 中的測試文件。後續的 AI BYOK Worker 需另外部署與測試。
