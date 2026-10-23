# BV-Note CPU Limit 修復版

## 原因
`/api/auth/register` 在 Worker 上以 JavaScript 執行 PBKDF2-SHA256 310000 次，導致 `Exceeded CPU Limit`。

## 修復
- 新註冊帳號改用原生 Web Crypto PBKDF2-SHA256 100000 次迭代，儲存帶版本前綴的雜湊。
- 新帳號登入使用相同的原生演算法。
- 原有 310000 次 PBKDF2 帳號不會被覆寫；登入時會回傳 409，表示需要獨立的密碼遷移程序。**本版本不提供舊帳號直接登入或自助重設功能。**
- Worker 保留先前 CORS 修復。

## 部署
1. 解壓縮到本地專案，**請勿覆蓋已設定的 Cloudflare Secret**。
2. `cd cloud-worker`
3. `npm install`
4. `node --check auth.js; node --check worker.js`
5. `npx wrangler deploy`
6. 在瀏覽器註冊新的 Gmail 帳號（需要先前設定的 SIGNUP_CODE），然後測試登入。

## 注意
- 無法在此環境實際連接你的 Cloudflare Worker 或 Neon 資料庫進行端到端測試。
- 此修復旨在避開已確認的 CPU 超限問題；實際部署後仍須測試。
- 100000 次 PBKDF2 低於部分現代密碼儲存建議的迭代強度；正式大量使用前建議評估更適合的獨立認證服務或可支援更高成本密碼雜湊的後端。
