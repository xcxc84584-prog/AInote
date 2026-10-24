# BV-Note v3.9.9 — AI S8–S10 Incremental

- S8: Isolated immutable conversation DAG and Markdown branch export (beta in-memory, not persisted).
- S9: PNG/JPEG/WebP signature validation, explicit selection and send. Website-key beta endpoint supports bounded `input_image` data URLs.
- S10: Local text and OOXML (DOCX/PPTX/XLSX) best-effort extraction, guarded ZIP text extraction, budgeted excerpts. PDF/legacy Office not yet supported; fail explicitly.
- Admin `/test` registers S8–S10 pure synthetic targets. Existing `/log` filters include new targets. Real backend errors tagged `kind:real` with target/trace ID.
- PowerShell terminal: multiline and semicolon-separated commands, sequential execution; semicolons inside quotes are not supported.
- `/check Data-Base-*`, `/ban-*`, `/delete all.log`, `/download all.log` are deferred because they require additional Neon SQL access, data governance and security controls. No silent stubs.
- No migrations. Legacy AI SEND, NOTE, Explorer, Cloud untouched.
