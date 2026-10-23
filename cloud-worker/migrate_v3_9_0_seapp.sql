CREATE TABLE IF NOT EXISTS bv_seapp_logs (
 id BIGSERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), trace_id VARCHAR(64) NOT NULL,
 user_id TEXT, behavior_id VARCHAR(64), condition_id VARCHAR(64), step_id VARCHAR(64), area_id VARCHAR(64) NOT NULL,
 previous_area VARCHAR(64), next_area VARCHAR(64), success SMALLINT NOT NULL CHECK(success IN(0,1)),
 error_id VARCHAR(64), message VARCHAR(180), file_path VARCHAR(200), function_name VARCHAR(100), suggestion VARCHAR(200)
);
CREATE INDEX IF NOT EXISTS bv_seapp_logs_user_time ON bv_seapp_logs(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS bv_seapp_logs_trace ON bv_seapp_logs(trace_id);
