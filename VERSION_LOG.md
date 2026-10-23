# BV-Note Version Log

## v3.8.9.2 — PowerShell Console Help Search and Admin FHI Access

- `/help` lists all visible commands with English descriptions and usage.
- `/help <keyword>` searches command syntax, descriptions and tags by case-insensitive substring, including `/help <d>` and `/help <FHI>`.
- `/admin <key>` remains excluded from help results. Admin access is verified by the Cloudflare Worker and represented by a signed 15-minute in-memory browser session.
- In Admin Mode, FHI list and deletion commands may access files belonging to all accounts. User Mode remains owner-scoped.
- `/delete ID.FHI:<ID>` hides a list record only; file, permissions and revisions remain intact. Optional `--user=<User-ID>` in Admin Mode.
- Console user-facing messages and help are in English.
- Admin key is not retained in terminal history or browser storage.

## v3.8.9.1 — Initial PowerShell Console

- Added `/powershell/` console, FHI list, and FHI delete commands.
- Added `bv_console_hidden_fhi` migration for non-destructive list hiding.
