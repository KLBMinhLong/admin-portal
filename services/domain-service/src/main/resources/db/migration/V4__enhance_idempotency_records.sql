-- ============================================================
-- V4: Enhance idempotency_records for UC-SEC-02
--     Add payload_hash, status columns + cleanup index
-- ============================================================

ALTER TABLE idempotency_records
    ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';

-- Index để tìm nhanh các record hết hạn cần cleanup
CREATE INDEX IF NOT EXISTS idx_idem_expires ON idempotency_records(expires_at);

-- Index để tìm nhanh theo status
CREATE INDEX IF NOT EXISTS idx_idem_status ON idempotency_records(status);
