-- One DIARY document per authenticated BV-NOTE account; CAS revision avoids lost updates.
CREATE TABLE IF NOT EXISTS bv_diary_documents (
  user_id UUID PRIMARY KEY REFERENCES bv_users(id) ON DELETE CASCADE,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
  document JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
