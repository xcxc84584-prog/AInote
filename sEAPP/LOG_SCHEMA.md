# LOG SCHEMA
Neon table: `bv_seapp_logs`. Only `success=0` events are inserted.
Fields: trace_id, user_id, behavior_id, condition_id, step_id, area_id, previous_area, next_area, success, error_id, message, file_path, function_name, suggestion, created_at.
`GET /api/seapp/logs?q=...` requires a valid Bearer session and returns only rows belonging to that user.
The Worker top-level catch currently records server failures with `user_id=NULL`; these are intentionally **not** exposed to ordinary accounts. Server operators must use Neon administration to inspect them. No public log-write endpoint exists.
Never store credentials, request bodies, or private document content. Message strings should be sanitized at call sites before recording.
