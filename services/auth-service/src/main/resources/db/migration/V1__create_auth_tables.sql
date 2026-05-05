-- ============================================================
-- V1: Auth Service — All tables in schema "auth"
-- Tables: users, auth_tokens, password_reset_tokens,
--         roles, permissions, user_roles, role_permissions,
--         rbac_audit_logs
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.users (
    id                  UUID            PRIMARY KEY,
    username            VARCHAR(50)     NOT NULL UNIQUE,
    email               VARCHAR(100)    NOT NULL UNIQUE,
    password_hash       VARCHAR(255)    NOT NULL,
    role                VARCHAR(50)     NOT NULL,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    is_email_verified   BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_2fa_enabled      BOOLEAN         NOT NULL DEFAULT FALSE,
    two_factor_secret   VARCHAR(255),
    reset_token         VARCHAR(255),
    reset_token_expiry  TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_active ON auth.users(is_active);

-- ────────────────────────────────────────────────────────────
-- 2. AUTH TOKENS (JWT session tracking)
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.auth_tokens (
    id          UUID            PRIMARY KEY,
    user_id     UUID            NOT NULL,
    token_jti   VARCHAR(255)    NOT NULL UNIQUE,
    token_hash  VARCHAR(255)    NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    issued_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at  TIMESTAMP WITH TIME ZONE,
    revoked_at  TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_auth_tokens_user_active ON auth.auth_tokens(user_id, is_active);
CREATE INDEX idx_auth_tokens_jti         ON auth.auth_tokens(token_jti);

-- ────────────────────────────────────────────────────────────
-- 3. PASSWORD RESET TOKENS
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.password_reset_tokens (
    id          UUID            PRIMARY KEY,
    user_id     UUID            NOT NULL,
    token_hash  VARCHAR(255)    NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_password_reset_tokens_user_active ON auth.password_reset_tokens(user_id, used_at);
CREATE INDEX idx_password_reset_tokens_hash        ON auth.password_reset_tokens(token_hash);

-- ────────────────────────────────────────────────────────────
-- 4. RBAC — ROLES
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.roles (
    id          UUID            PRIMARY KEY,
    code        VARCHAR(50)     NOT NULL UNIQUE,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 5. RBAC — PERMISSIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.permissions (
    id          UUID            PRIMARY KEY,
    code        VARCHAR(100)    NOT NULL UNIQUE,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    resource    VARCHAR(50),
    action      VARCHAR(50),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 6. RBAC — USER ↔ ROLE junction
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES auth.users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES auth.roles(id)   ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_user ON auth.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON auth.user_roles(role_id);

-- ────────────────────────────────────────────────────────────
-- 7. RBAC — ROLE ↔ PERMISSION junction
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.role_permissions (
    role_id       UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role       FOREIGN KEY (role_id)       REFERENCES auth.roles(id)       ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES auth.permissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role       ON auth.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON auth.role_permissions(permission_id);

-- ────────────────────────────────────────────────────────────
-- 8. RBAC AUDIT LOG
-- ────────────────────────────────────────────────────────────
CREATE TABLE auth.rbac_audit_logs (
    id              UUID            PRIMARY KEY,
    actor_username  VARCHAR(50)     NOT NULL,
    action          VARCHAR(100)    NOT NULL,
    target_type     VARCHAR(50)     NOT NULL,
    target_id       VARCHAR(100)    NOT NULL,
    details         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rbac_audit_logs_target ON auth.rbac_audit_logs(target_type, target_id);
CREATE INDEX idx_rbac_audit_logs_actor  ON auth.rbac_audit_logs(actor_username);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
INSERT INTO auth.roles (id, code, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'ADMIN',               'Administrator',       'Full system access'),
    ('22222222-2222-2222-2222-222222222222', 'FINANCE_MANAGER',     'Finance Manager',     'Financial approvals and reports'),
    ('33333333-3333-3333-3333-333333333333', 'DEPARTMENT_LEAD',     'Department Lead',     'Department-level approvals'),
    ('44444444-4444-4444-4444-444444444444', 'PROCUREMENT_OFFICER', 'Procurement Officer', 'Procurement processing'),
    ('55555555-5555-5555-5555-555555555555', 'USER',                'Regular User',        'Basic user access')
ON CONFLICT (code) DO NOTHING;

-- Permissions
INSERT INTO auth.permissions (id, code, name, description, resource, action) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'system.config',  'System Configuration', 'Manage RBAC and system configuration', 'system',  'config'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'request.create', 'Create Request',       'Create purchasing requests',           'request', 'create'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'request.submit', 'Submit Request',       'Submit purchasing requests for approval','request','submit'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'request.approve','Approve Request',      'Approve purchasing requests',          'request', 'approve'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'request.reject', 'Reject Request',       'Reject purchasing requests',           'request', 'reject'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'report.view',    'View Reports',         'View reports',                         'report',  'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'report.export',  'Export Reports',       'Export reports',                       'report',  'export'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'user.manage',    'Manage Users',         'View and edit user details and status','user',    'manage'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 'role.manage',    'Manage Roles',         'View and edit roles and permissions',  'role',    'manage')
ON CONFLICT (code) DO NOTHING;

-- Role ↔ Permission assignments
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM (VALUES
    -- ADMIN gets everything
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8'::uuid),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9'::uuid),
    -- FINANCE_MANAGER
    ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'::uuid),
    -- DEPARTMENT_LEAD
    ('33333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid),
    -- PROCUREMENT_OFFICER
    ('44444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid),
    -- USER
    ('55555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid)
) AS seed(role_id, permission_id)
ON CONFLICT (role_id, permission_id) DO NOTHING;
