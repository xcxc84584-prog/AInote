# BYOK Worker 502 diagnosis

The previous `catch {}` swallowed the actual upstream exception. This patch logs the exception type and a redacted message in Wrangler logs, and returns a stable error code. It does **not** claim to resolve the upstream connectivity issue before the actual error is observed.

1. From `ai-byok-worker`, run `npx.cmd wrangler deploy`.
2. Run `npx.cmd wrangler tail --format pretty`.
3. On the website, send one short test prompt.
4. Read `BV_BYOK_UPSTREAM_FAILURE` in the tail output. Do not share API keys or authorization headers.

The worker allowlist is set to `https://xcxc84584-prog.github.io`.
