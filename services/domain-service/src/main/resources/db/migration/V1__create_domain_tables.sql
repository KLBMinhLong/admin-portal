-- ============================================================
-- V1: Domain Service schema — departments, purchasing_requests,
--     purchase_items, idempotency_records
-- ============================================================

-- Departments (reference table)
CREATE TABLE IF NOT EXISTS departments (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(20)  UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Purchasing Requests
CREATE TABLE purchasing_requests (
    id               BIGSERIAL    PRIMARY KEY,
    request_number   VARCHAR(20)  UNIQUE NOT NULL,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    requested_by     VARCHAR(50)  NOT NULL,       -- username from JWT
    requested_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
    status           VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    total_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency         VARCHAR(3)   NOT NULL DEFAULT 'VND',
    department_id    BIGINT       REFERENCES departments(id),
    cost_center      VARCHAR(50),
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(50),
    updated_by       VARCHAR(50),
    CONSTRAINT chk_status CHECK (status IN (
        'DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'
    ))
);

CREATE INDEX idx_pr_status          ON purchasing_requests(status);
CREATE INDEX idx_pr_requested_by    ON purchasing_requests(requested_by);
CREATE INDEX idx_pr_department      ON purchasing_requests(department_id);
CREATE INDEX idx_pr_request_number  ON purchasing_requests(request_number);

-- Purchase Items (line items of a request)
CREATE TABLE purchase_items (
    id              BIGSERIAL       PRIMARY KEY,
    request_id      BIGINT          NOT NULL REFERENCES purchasing_requests(id) ON DELETE CASCADE,
    item_code       VARCHAR(50),
    item_name       VARCHAR(200)    NOT NULL,
    quantity        INT             NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(18,2)   NOT NULL CHECK (unit_price >= 0),
    total_price     NUMERIC(18,2)   NOT NULL CHECK (total_price >= 0),
    specification   TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pi_request ON purchase_items(request_id);

-- Idempotency records
CREATE TABLE idempotency_records (
    id               BIGSERIAL   PRIMARY KEY,
    idempotency_key  VARCHAR(64) UNIQUE NOT NULL,
    response_body    TEXT,                              -- JSON of the original response
    http_status      INT         NOT NULL DEFAULT 201,
    created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at       TIMESTAMP   NOT NULL
);

CREATE INDEX idx_idem_key ON idempotency_records(idempotency_key);

-- Sequence for request number generation (PR-2026-001, PR-2026-002, …)
CREATE SEQUENCE IF NOT EXISTS seq_request_number START 1 INCREMENT 1;

-- Seed departments
INSERT INTO departments (code, name) VALUES
    ('IT',    'Information Technology'),
    ('FIN',   'Finance'),
    ('HR',    'Human Resources'),
    ('PROC',  'Procurement'),
    ('OPS',   'Operations');
