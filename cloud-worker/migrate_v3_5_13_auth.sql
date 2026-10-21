-- Run once in Neon SQL Editor; additive, does not modify existing projects/cloud_files/commits.
CREATE TABLE IF NOT EXISTS bv_users (
 id UUID PRIMARY KEY, email TEXT NOT NULL UNIQUE,
 password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bv_sessions (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bv_sessions_expiry ON bv_sessions(expires_at);
CREATE TABLE IF NOT EXISTS bv_ai_usage (
 user_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 usage_day DATE NOT NULL, used INTEGER NOT NULL DEFAULT 0 CHECK(used BETWEEN 0 AND 100),
 PRIMARY KEY(user_id,usage_day)
);
