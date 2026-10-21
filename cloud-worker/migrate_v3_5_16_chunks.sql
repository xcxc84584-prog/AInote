-- BV-Note v3.5.16: idempotent chunk accounting
CREATE TABLE IF NOT EXISTS bv_ai_chunks (
 user_id UUID NOT NULL, upload_id UUID NOT NULL, part_index INTEGER NOT NULL,
 part_count INTEGER NOT NULL, bytes INTEGER NOT NULL, usage_day DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,upload_id,part_index)
);
CREATE INDEX IF NOT EXISTS bv_ai_chunks_created ON bv_ai_chunks(created_at);
