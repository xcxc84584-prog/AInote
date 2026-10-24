-- Run in Neon SQL Editor, not PowerShell. Idempotent.
CREATE TABLE IF NOT EXISTS bv_ai_token_totals (
  user_id TEXT PRIMARY KEY,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
