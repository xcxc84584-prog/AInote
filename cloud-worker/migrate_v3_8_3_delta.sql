-- BV-Note v3.8.3 incremental storage. Non-destructive; apply to Neon before deployment.
CREATE TABLE IF NOT EXISTS bv_delta_chunks (
 owner_id UUID NOT NULL,
 sha256 TEXT NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
 data BYTEA NOT NULL,
 byte_length INTEGER NOT NULL CHECK (byte_length BETWEEN 1 AND 262144),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(owner_id,sha256)
);
CREATE TABLE IF NOT EXISTS bv_delta_revisions (
 file_id UUID NOT NULL REFERENCES bv_cloud_documents(file_id) ON DELETE CASCADE,
 owner_id UUID NOT NULL,
 revision INTEGER NOT NULL,
 manifest JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(file_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_bv_delta_revisions_owner ON bv_delta_revisions(owner_id,file_id,revision DESC);
-- Old complete ZIP revisions remain readable; no migration of existing ZIP bytes is required.
