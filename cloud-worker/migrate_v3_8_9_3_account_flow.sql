-- Apply in Neon SQL Editor before deploying v3.8.9.3.
CREATE TABLE IF NOT EXISTS bv_account_request_seconds (
 user_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 second_at TIMESTAMPTZ NOT NULL,
 request_count INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(user_id,second_at)
);
CREATE INDEX IF NOT EXISTS bv_account_request_seconds_time_idx ON bv_account_request_seconds(second_at);
-- Optional scheduled retention (after operational approval): DELETE FROM bv_account_request_seconds WHERE second_at < NOW()-INTERVAL '30 days';
