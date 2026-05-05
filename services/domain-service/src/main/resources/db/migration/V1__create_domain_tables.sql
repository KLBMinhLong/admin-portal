-- ============================================================
-- V1: Domain Service — All tables in schema "domain"
-- Tables: departments, purchasing_requests, purchase_items,
--         approval_steps, idempotency_records, request_comments
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. DEPARTMENTS (reference table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE domain.departments (
    id          BIGSERIAL       PRIMARY KEY,
    code        VARCHAR(20)     UNIQUE NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 2. PURCHASING REQUESTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE domain.purchasing_requests (
    id               BIGSERIAL       PRIMARY KEY,
    request_number   VARCHAR(20)     UNIQUE NOT NULL,
    title            VARCHAR(200)    NOT NULL,
    description      TEXT,
    requested_by     VARCHAR(50)     NOT NULL,
    requested_date   DATE            NOT NULL DEFAULT CURRENT_DATE,
    status           VARCHAR(30)     NOT NULL DEFAULT 'DRAFT',
    total_amount     NUMERIC(18,2)   NOT NULL DEFAULT 0,
    currency         VARCHAR(3)      NOT NULL DEFAULT 'VND',
    department_id    BIGINT          REFERENCES domain.departments(id),
    cost_center      VARCHAR(50),
    version          BIGINT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(50),
    updated_by       VARCHAR(50),
    CONSTRAINT chk_status CHECK (status IN (
        'DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'
    ))
);

CREATE INDEX idx_pr_status         ON domain.purchasing_requests(status);
CREATE INDEX idx_pr_requested_by   ON domain.purchasing_requests(requested_by);
CREATE INDEX idx_pr_department     ON domain.purchasing_requests(department_id);
CREATE INDEX idx_pr_request_number ON domain.purchasing_requests(request_number);

-- ────────────────────────────────────────────────────────────
-- 3. PURCHASE ITEMS (line items of a request)
-- ────────────────────────────────────────────────────────────
CREATE TABLE domain.purchase_items (
    id              BIGSERIAL       PRIMARY KEY,
    request_id      BIGINT          NOT NULL REFERENCES domain.purchasing_requests(id) ON DELETE CASCADE,
    item_code       VARCHAR(50),
    item_name       VARCHAR(200)    NOT NULL,
    quantity        INT             NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(18,2)   NOT NULL CHECK (unit_price >= 0),
    total_price     NUMERIC(18,2)   NOT NULL CHECK (total_price >= 0),
    specification   TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pi_request ON domain.purchase_items(request_id);

-- ────────────────────────────────────────────────────────────
-- 4. APPROVAL STEPS (workflow)
-- ────────────────────────────────────────────────────────────
CREATE TABLE domain.approval_steps (
    id               BIGSERIAL       PRIMARY KEY,
    request_id       BIGINT          NOT NULL REFERENCES domain.purchasing_requests(id) ON DELETE CASCADE,
    step_order       INT             NOT NULL,
    role_name        VARCHAR(50)     NOT NULL,
    approver         VARCHAR(50),
    status           VARCHAR(30)     NOT NULL DEFAULT 'PENDING',
    comment          TEXT,
    completed_at     TIMESTAMP,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_app_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'))
);

CREATE INDEX idx_app_step_request ON domain.approval_steps(request_id);

-- ────────────────────────────────────────────────────────────
-- 5. IDEMPOTENCY RECORDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE domain.idempotency_records (
    id               BIGSERIAL       PRIMARY KEY,
    idempotency_key  VARCHAR(64)     UNIQUE NOT NULL,
    response_body    TEXT,
    http_status      INT             NOT NULL DEFAULT 201,
    payload_hash     VARCHAR(64),
    status           VARCHAR(20)     NOT NULL DEFAULT 'COMPLETED',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at       TIMESTAMP       NOT NULL
);

CREATE INDEX idx_idem_key     ON domain.idempotency_records(idempotency_key);
CREATE INDEX idx_idem_expires ON domain.idempotency_records(expires_at);
CREATE INDEX idx_idem_status  ON domain.idempotency_records(status);

-- ────────────────────────────────────────────────────────────
-- 6. REQUEST COMMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE domain.request_comments (
    id                BIGSERIAL       PRIMARY KEY,
    request_id        BIGINT          NOT NULL,
    author_username   VARCHAR(100)    NOT NULL,
    author_role       VARCHAR(100),
    content           TEXT            NOT NULL,
    is_system         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    CONSTRAINT fk_request_comments_request_id FOREIGN KEY (request_id) REFERENCES domain.purchasing_requests(id) ON DELETE CASCADE
);

CREATE INDEX idx_request_comments_request_id ON domain.request_comments(request_id);

-- ────────────────────────────────────────────────────────────
-- SEQUENCE for request number generation
-- ────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS domain.seq_request_number START 1 INCREMENT 1;

-- ────────────────────────────────────────────────────────────
-- SEED DATA — Departments
-- ────────────────────────────────────────────────────────────
INSERT INTO domain.departments (code, name) VALUES
    ('IT',   'Information Technology'),
    ('FIN',  'Finance'),
    ('HR',   'Human Resources'),
    ('PROC', 'Procurement'),
    ('OPS',  'Operations');
