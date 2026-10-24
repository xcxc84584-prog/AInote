CREATE TABLE IF NOT EXISTS bv_access_bans(kind TEXT NOT NULL CHECK(kind IN ('id','ip','g')),value TEXT NOT NULL,created_by TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(kind,value));
CREATE TABLE IF NOT EXISTS bv_ban_unlock_attempts(fingerprint TEXT PRIMARY KEY,attempts INTEGER NOT NULL DEFAULT 0,locked_until TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS bv_access_bans_kind_value_idx ON bv_access_bans(kind,value);
