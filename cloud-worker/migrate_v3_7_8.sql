-- Run in Neon SQL Editor after backup. Additive migration, no destructive edits.
CREATE TABLE IF NOT EXISTS bv_cloud_documents (
 file_id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 project_id UUID, name TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0,
 life_days INTEGER NOT NULL DEFAULT 7, expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bv_cloud_documents_owner_idx ON bv_cloud_documents(owner_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS bv_cloud_uploads (
 id UUID PRIMARY KEY, file_id UUID NOT NULL REFERENCES bv_cloud_documents(file_id) ON DELETE CASCADE,
 owner_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, size_bytes BIGINT NOT NULL, part_count INTEGER NOT NULL,
 sha256 TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'uploading' CHECK(state IN ('uploading','complete')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ,
 UNIQUE(file_id,revision)
);
CREATE TABLE IF NOT EXISTS bv_cloud_parts (
 upload_id UUID NOT NULL REFERENCES bv_cloud_uploads(id) ON DELETE CASCADE,
 part_index INTEGER NOT NULL CHECK(part_index>=0), data BYTEA NOT NULL,
 sha256 TEXT NOT NULL, byte_length INTEGER NOT NULL,
 PRIMARY KEY(upload_id,part_index)
);
CREATE INDEX IF NOT EXISTS bv_cloud_uploads_file_idx ON bv_cloud_uploads(file_id,revision DESC);
