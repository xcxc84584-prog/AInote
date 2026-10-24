# BV-Note v3.9.8 — AI Chat S6–S7

- S6: GPT-5 Responses API opt-in server endpoint `/api/ai/v2/responses`, bounded request builder, site-key quota enforcement.
- S7: SSE parser, streaming state machine, cancellation helper; upstream SSE passthrough.
- `/test help`: S6/S7 four new test targets.
- `/log`: distinguish TEST_RUN simulations (white) from real AI errors (yellow) in PowerShell UI.
- Real server errors logged with `trace_id`, `target`, `kind=real`; never log request body or secrets.
- Existing AI chat unchanged; no automatic activation of new engine. Front-end UI migration and BYOK streaming integration require separate follow-up.
- Deferred: SQL table introspection and blacklist commands because they require Neon API / database changes.
- No SQL migration in this patch.
