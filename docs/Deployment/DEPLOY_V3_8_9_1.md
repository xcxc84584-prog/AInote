# BV-Note v3.8.9.1 — PowerShell Console

## Features
- `/AInote/powershell/` green-on-black console.
- `/help`, `/check File-Hash-ID-List`, `/delete ALL.FHI:<UUID>`, `/delete ID.FHI:<UUID>`, `/delete PART.FHI:<UUID><1|[1,4,7]>`.
- FHI commands are **User Level** and strictly owner-scoped.
- ID.FHI only hides list entry. Ownership, files, and revisions remain unchanged.
- ALL and PART require explicit confirmation.
- `/admin <key>` hidden from help, validates Worker secret, grants no cross-account access.

## Deploy
1. Backup Neon and existing source.
2. Run `cloud-worker/migrate_v3_8_9_1_console.sql` in Neon SQL Editor.
3. Optionally set admin secret: `cd cloud-worker; npx wrangler secret put BV_CONSOLE_ADMIN_KEY`.
4. Deploy Worker: `cd cloud-worker; npx wrangler deploy`.
5. Commit frontend `powershell/` and updated worker source to GitHub Pages.
6. Open `https://xcxc84584-prog.github.io/AInote/powershell/`.

## Safety
- FHI UUID ownership checked in Worker for each request.
- ALL deletes the owned document and dependent uploads, parts and delta revisions via FK cascade. Orphaned content-addressed delta chunks are not removed automatically (shared across revisions); clean them only with a verified reference-aware GC.
- PART deletes selected completed revisions, never last revision; revision numbers are not renumbered.
- `ID.FHI` hides only console list entry. It is not an ACL or authorization change.
- `/admin` validates a key only; it does not create persistent admin session or elevate any command.
- This release has not been end-to-end tested against production Neon. Test on backup/test account first.
