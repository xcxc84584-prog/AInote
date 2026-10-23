# BV-Note v3.5.18.2 PBKDF2 修復

修正 Cloudflare Worker WebCrypto PBKDF2 迭代次數上限問題。保留 310000 次、SHA-256、32 bytes、原始 UTF-8 salt 與 Base64URL 格式，既有密碼 hash 不須重設。

在 cloud-worker 執行 `npm install`、`npx wrangler deploy`。只需部署 Worker，前端不需更新。

注意：純 JavaScript PBKDF2 在 Worker 中可能較慢，應實測登入效能與 CPU 限制。請勿將迭代次數直接降至 100000。
