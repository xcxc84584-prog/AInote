# BV-Note v3.5.18.4 — 舊帳號安全遷移

此版不允許只憑舊 Gmail 地址或註冊邀請碼重設密碼，避免帳號遭冒用。使用者必須能接收原 Gmail 的一次性驗證碼。既有 user id 保留，資料關聯不變；遷移後舊 session 撤銷。

## 部署前必要步驟

1. Neon SQL Editor 執行 `cloud-worker/migrate_v3_5_18_4.sql`。
2. 申請 Resend 郵件寄送服務，驗證寄件網域及寄件地址。
3. 進入 `cloud-worker`，執行：

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MIGRATION_FROM_EMAIL
npx wrangler secret put MIGRATION_PEPPER
node --check auth.js
node --check worker.js
npx wrangler deploy
```

`MIGRATION_FROM_EMAIL` 必須是 Resend 已驗證的寄件地址，例如 `BV-Note <security@your-verified-domain.example>`；`MIGRATION_PEPPER` 請使用至少 32 位隨機秘密字串並妥善保存。

4. 將根目錄的靜態網站檔案部署至 GitHub Pages。

## 使用

登入視窗 → 舊帳號遷移 → 輸入原 Gmail → 寄送驗證碼 → 填寫 12 位驗證碼與新密碼 → 完成遷移 → 登入。

## 安全及限制

- 無法存取原 Gmail 的使用者，不能透過此流程自行接管帳號；須另行進行人工身分驗證。
- 遷移不需要舊密碼，依靠已驗證的原信箱所有權；請保護電子郵件帳號。
- 同一 email 每小時最多 3 次驗證碼寄送；驗證碼 10 分鐘有效且只能使用一次。
- 正式上線前仍應在 Cloudflare WAF 增加 IP 與端點層級的 rate limiting，以抵抗跨帳號大量請求與猜碼。
- 本修復未在真實 Resend / Neon 環境完成端到端測試。
