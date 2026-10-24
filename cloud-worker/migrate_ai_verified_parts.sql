-- S5: verified transport receipts only. No attachment bytes stored.
-- Apply in Neon SQL editor BEFORE deploying Worker. Requires bv_users and bv_ai_usage.
CREATE TABLE IF NOT EXISTS bv_ai_verified_parts (
 user_id UUID NOT NULL REFERENCES bv_users(id) ON DELETE CASCADE,
 upload_id UUID NOT NULL,
 part_index INTEGER NOT NULL,
 part_count INTEGER NOT NULL CHECK (part_count BETWEEN 1 AND 200),
 byte_length INTEGER NOT NULL CHECK (byte_length BETWEEN 1 AND 5242880),
 sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
 usage_day DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY (user_id,upload_id,part_index)
);
CREATE INDEX IF NOT EXISTS bv_ai_verified_parts_created_idx ON bv_ai_verified_parts(created_at);
CREATE OR REPLACE FUNCTION bv_claim_ai_verified_part(p_user UUID,p_upload UUID,p_index INTEGER,p_count INTEGER,p_bytes INTEGER,p_hash TEXT)
RETURNS TABLE(status TEXT) LANGUAGE plpgsql AS $$
DECLARE v_day DATE; v_used INTEGER; v_old RECORD;
BEGIN
 IF p_index<0 OR p_index>=p_count OR p_count<1 OR p_count>200 OR p_bytes<1 OR p_bytes>5242880 OR p_hash !~ '^[0-9a-f]{64}$' THEN
  RAISE EXCEPTION 'invalid verified part';
 END IF;
 v_day:=(NOW() AT TIME ZONE 'Asia/Taipei')::date;
 INSERT INTO bv_ai_usage(user_id,usage_day,used) VALUES(p_user,v_day,0) ON CONFLICT DO NOTHING;
 SELECT used INTO v_used FROM bv_ai_usage WHERE user_id=p_user AND usage_day=v_day FOR UPDATE;
 SELECT part_count,byte_length,sha256 INTO v_old FROM bv_ai_verified_parts WHERE user_id=p_user AND upload_id=p_upload AND part_index=p_index;
 IF FOUND THEN
  IF v_old.part_count=p_count AND v_old.byte_length=p_bytes AND v_old.sha256=p_hash THEN RETURN QUERY SELECT 'duplicate'::TEXT;
  ELSE RETURN QUERY SELECT 'conflict'::TEXT; END IF;
  RETURN;
 END IF;
 IF v_used>=100 THEN RETURN QUERY SELECT 'limit'::TEXT; RETURN; END IF;
 INSERT INTO bv_ai_verified_parts(user_id,upload_id,part_index,part_count,byte_length,sha256,usage_day)
 VALUES(p_user,p_upload,p_index,p_count,p_bytes,p_hash,v_day);
 UPDATE bv_ai_usage SET used=used+1 WHERE user_id=p_user AND usage_day=v_day;
 RETURN QUERY SELECT 'charged'::TEXT;
END $$;
