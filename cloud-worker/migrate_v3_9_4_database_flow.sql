-- BV-Note v3.9.4 application-observed usage, no existing table changes.
CREATE TABLE IF NOT EXISTS bv_database_flow_daily (
 day date PRIMARY KEY,
 upload_bytes bigint NOT NULL DEFAULT 0 CHECK(upload_bytes>=0),
 download_bytes bigint NOT NULL DEFAULT 0 CHECK(download_bytes>=0),
 egress_proxy_bytes bigint NOT NULL DEFAULT 0 CHECK(egress_proxy_bytes>=0),
 request_count bigint NOT NULL DEFAULT 0 CHECK(request_count>=0)
);
CREATE TABLE IF NOT EXISTS bv_database_limits (
 resource text PRIMARY KEY CHECK(resource IN ('Storage','Egress','Upload','Download')),
 limit_bytes bigint CHECK(limit_bytes IS NULL OR limit_bytes>0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO bv_database_limits(resource,limit_bytes) VALUES
 ('Storage',524288000),('Egress',5000000000),('Upload',NULL),('Download',NULL)
ON CONFLICT(resource) DO NOTHING;
