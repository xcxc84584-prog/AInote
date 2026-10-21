-- Run once in Neon SQL Editor before deploying v3.5.19.
CREATE TABLE IF NOT EXISTS bv_auth_email_verifications (
 id UUID PRIMARY KEY,
 email TEXT NOT NULL,
 code_hash TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ,
 attempts INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bv_auth_email_verifications_email_created ON bv_auth_email_verifications(email,created_at DESC);
