-- Run on the existing Neon database; preserve bv_users IDs and user data.
CREATE TABLE IF NOT EXISTS bv_google_identities (
  id UUID PRIMARY KEY REFERENCES bv_users(id) ON DELETE CASCADE,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bv_google_email ON bv_google_identities(email);
