-- Additive migration: hides an FHI from console list ONLY, without changing ownership.
CREATE TABLE IF NOT EXISTS bv_console_hidden_fhi (
 owner_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 file_id UUID NOT NULL REFERENCES bv_cloud_documents(file_id) ON DELETE CASCADE,
 hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(owner_id,file_id)
);
