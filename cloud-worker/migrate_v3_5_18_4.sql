-- Run once in Neon SQL Editor before deploying.
CREATE TABLE IF NOT EXISTS bv_auth_migrations (
 id UUID PRIMARY KEY,
 email TEXT NOT NULL,
 code_hash TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bv_auth_migrations_email_created ON bv_auth_migrations(email,created_at DESC);
