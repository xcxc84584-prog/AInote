# BV-Note v3.8.9.2 Deployment

1. Back up your Neon database and existing project.
2. In Neon SQL Editor, run `cloud-worker/migrate_v3_8_9_1_console.sql` if not already applied. No new migration is required for v3.8.9.2.
3. In `cloud-worker/`, run `npx wrangler secret put BV_CONSOLE_ADMIN_KEY` and save the secret privately.
4. In `cloud-worker/`, run `npx wrangler deploy`.
5. Deploy the front-end folder to GitHub Pages, including `powershell/`. Do not commit `.dev.vars`, `.env`, or secrets.
6. Open `/AInote/powershell/` and test `/help`, `/help <d>`, `/help <FHI>`, `/check File-Hash-ID-List`, and admin login with test accounts.
7. Before destructive operations, back up the database and test with disposable documents.

Security note: Administrator sessions last 15 minutes and are held only in the current browser tab memory. The administrator key must remain a Worker secret.
