# BV-Note v3.8.9.3 — Account-Flow Admin Commands

## Deployment
1. Back up Neon. Run `cloud-worker/migrate_v3_8_9_3_account_flow.sql` in Neon SQL Editor.
2. From `cloud-worker`, run `npx wrangler deploy`.
3. From the repository root, deploy the updated source to GitHub Pages if needed (console UI unchanged).
4. Sign in, visit `/powershell`, run `/admin <admin-key>`, then `/help Account-Flow`.

## Commands
- `/check Account-List` — all registered users, maximum 1,000 rows.
- `/check ALL.Account-Flow:<UserID>` — all checks, accepts UUID or email.
- `/check PART.Account-Flow:<UserID><1>` — cloud stored upload part bytes / 1024.
- `/check PART.Account-Flow:<UserID><[2,3]>` — today website-key usage and request metrics.

## Numbered checks
1. Stored bytes in `bv_cloud_parts` owned by account, shown in KB. This excludes legacy storage and DB overhead.
2. Website-provided ChatGPT key usage from `bv_ai_usage`, Taipei calendar day.
3. Today's authenticated requests, and highest observed per-second count. The asynchronous counter is best-effort; requests without Bearer sessions are excluded, and historic requests before deployment cannot be recovered.

Admin verification is required on all commands. New numbered checks can be added to the `checks` registry in `cloud-worker/console-api.js`.
