-- BV-Note v3.8.9.4. Run once in Neon SQL Editor before Worker deployment.
CREATE TABLE IF NOT EXISTS bv_console_guests (guest_number INTEGER PRIMARY KEY CHECK (guest_number BETWEEN 1 AND 100000),guest_token TEXT UNIQUE NOT NULL,last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS bv_console_guests_last_seen_idx ON bv_console_guests(last_seen);
CREATE TABLE IF NOT EXISTS bv_guest_request_seconds(guest_number INTEGER NOT NULL,second_at TIMESTAMPTZ NOT NULL,request_count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guest_number,second_at));
CREATE TABLE IF NOT EXISTS bv_console_ip_history(id BIGSERIAL PRIMARY KEY,identity TEXT NOT NULL,ip VARCHAR(45) NOT NULL,seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS bv_console_ip_identity_time_idx ON bv_console_ip_history(identity,seen_at DESC);
CREATE TABLE IF NOT EXISTS bv_console_logs(id BIGSERIAL PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),source VARCHAR(64) NOT NULL,level VARCHAR(16) NOT NULL,event_code VARCHAR(64) NOT NULL,message TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS bv_console_logs_time_idx ON bv_console_logs(created_at DESC);
