-- Run once in Neon SQL Editor before deploying the new Worker.
ALTER TABLE cloud_files ADD COLUMN IF NOT EXISTS life_days INTEGER;
ALTER TABLE cloud_files ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_cloud_files_expires_at ON cloud_files(expires_at);
-- Legacy records remain NULL (no automatic expiration) until explicitly migrated.
