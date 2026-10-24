# BV-Note v3.9.10 — Unified AI Composer

- Remove S6/S7 and S8/S10 beta panels from main page; preserve beta modules on disk for rollback.
- Reuse original textarea, attachment button, SEND, AI Explorer and local chat blocks.
- Website-key SEND uses S6/S7 streaming API with S9 image validation and S10 local document excerpts.
- Visible upload/response progress with indeterminate phases (no fabricated upload percentage).
- Browser-side errors remain local; Worker error logs use existing `ai-s67` reporter and trace ID.
- BYOK remains on legacy SEND path; its upload progress is not instrumented by this change.
- PDF website-mode parsing remains unsupported; image max 1, <=5 MiB; documents excerpt-only.
