-- ============================================================
-- V3: Add version column for Optimistic Locking
-- ============================================================

ALTER TABLE purchasing_requests ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;
