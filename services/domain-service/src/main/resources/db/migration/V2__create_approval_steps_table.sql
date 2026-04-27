-- ============================================================
-- V2: Create approval steps table for workflow
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_steps (
    id               BIGSERIAL    PRIMARY KEY,
    request_id       BIGINT       NOT NULL REFERENCES purchasing_requests(id) ON DELETE CASCADE,
    step_order       INT          NOT NULL,
    role_name        VARCHAR(50)  NOT NULL,
    approver         VARCHAR(50), -- Username of actual approver
    status           VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    comment          TEXT,
    completed_at     TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_app_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'))
);

CREATE INDEX idx_app_step_request ON approval_steps(request_id);
