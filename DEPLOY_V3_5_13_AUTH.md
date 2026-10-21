# BV-Note v3.5.13 部署教學（測試版）

## 注意
- 本 ZIP 是可部署的 **邀請碼限制測試版**，不是可直接公開註冊的正式商用版。
- 新帳號需要 Gmail 格式與 `SIGNUP_CODE` 邀請碼；**沒有寄送驗證郵件，不能證明信箱擁有權**。
- Session 以隨機 token 保存在瀏覽器 localStorage，有效 30 天；F5 和重開瀏覽器保持登入。清除網站資料或換瀏覽器會失去登入。
- 每帳號每日最多 100 次 **成功的上游 API 呼叫**，按 Asia/Taipei 日期計算；錯誤回補。未完成的 AI 回答若已被上游接受，仍可能產生成本。
- 密碼 PBKDF2 SHA-256 310000 次雜湊與獨立 salt；正式公開建議使用專門身分服務、Email 驗證、速率限制、Bot 防護與費用預算控制。
- **既有雲端文件 API 仍保留原來的 File Hash ID 模式，沒有新增檔案所有權 ACL。不要將其視為私人帳號儲存空間。**

## 1. 先備份
在 PowerShell 專案根目錄執行 `git status -sb`；將舊版資料另存，**不要刪除 `.git`**。請將 ZIP 內容複製到現有 Repo 的新分支，勿覆寫既有 `wrangler.toml` 中自己的環境設定前先比較。

## 2. Neon SQL Editor
執行 `cloud-worker/migrate_v3_5_13_auth.sql`。僅新增 `bv_users`、`bv_sessions`、`bv_ai_usage` 三張表；既有三張表不變。

## 3. Cloudflare Worker（必須先於前端）
```powershell
cd .\cloud-worker
npm install
.\node_modules\.bin\wrangler.cmd secret put DATABASE_URL
.\node_modules\.bin\wrangler.cmd secret put OPENAI_API_KEY
.\node_modules\.bin\wrangler.cmd secret put SIGNUP_CODE
.\node_modules\.bin\wrangler.cmd deploy
```
`DATABASE_URL` 已設定且正確時不需要重設；輸入 Secret 時不要在指令中明文傳入。`SIGNUP_CODE` 請設高強度、僅給測試者的邀請碼。`ALLOWED_ORIGIN` 必須是你的 GitHub Pages **origin**（例如 `https://xcxc84584-prog.github.io`，不含路徑）。OpenAI Key 僅存在 Worker Secret。

## 4. 驗證 Worker
```powershell
Invoke-RestMethod 'https://bv-note-cloud.xcxc84584.workers.dev/api/health'
```
接著用瀏覽器在網站 UI 註冊測試帳號、登入、F5、關閉再開啟、AI Chat 發送一則、登出。註冊需要邀請碼。

## 5. GitHub Pages
在新分支 Commit 並 Push，建立 PR，測試後合併到 `main`（若 Pages 設定 `main` 根目錄部署）。
```powershell
git switch -c feature/v3.5.13-auth
git add -A
git diff --cached --check
git commit -m "feat: persistent login and server-side AI quota"
git push -u origin feature/v3.5.13-auth
```
請先用測試環境驗證 Worker，再部署正式 Worker；正式網站合併前先確認 CORS、Neon 與 OpenAI Key。部署前確認沒有把任何 Secret 放進 Git。

## 6. 測試案例
1. 註冊沒有邀請碼會拒絕；重複 Gmail 拒絕。
2. 錯誤密碼拒絕；正確密碼登入。
3. F5 / 重開瀏覽器維持登入。
4. 登出後舊 token 不可用。
5. AI 請求計數由後端控制；第 101 次拒絕。
6. 未登入不能使用網站 AI；跨 Origin 不應取得 API 回應。
7. 既有 Markdown、Explorer、雲端文件功能仍可用。

## 重要限制
本版沒有 Email ownership verification、忘記密碼、登入暴力破解限速、帳號綁定雲端文件、全站總額度/成本硬限制，**不建議直接向所有公眾開放註冊**。請保留邀請碼限制直到完成這些安全控制。
