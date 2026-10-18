CREATE TABLE IF NOT EXISTS projects (
 id UUID PRIMARY KEY,
 name TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cloud_files (
 file_id UUID PRIMARY KEY,
 project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 last_commit TIMESTAMPTZ,
 life_days INTEGER CHECK (life_days IN (1,7,14,30,90)),
 expires_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS commits (
 file_id UUID NOT NULL REFERENCES cloud_files(file_id) ON DELETE CASCADE,
 revision INTEGER NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('initial','full','incremental')),
 content TEXT NOT NULL,
 sha256 TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(file_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_commits_file ON commits(file_id,revision DESC);
