CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    resource VARCHAR(50),
    action VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

CREATE TABLE IF NOT EXISTS rbac_audit_logs (
    id UUID PRIMARY KEY,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rbac_audit_logs_target ON rbac_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_logs_actor ON rbac_audit_logs(actor_username);

INSERT INTO roles (id, code, name, description)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'ADMIN', 'Administrator', 'Full system access'),
    ('22222222-2222-2222-2222-222222222222', 'FINANCE_MANAGER', 'Finance Manager', 'Financial approvals and reports'),
    ('33333333-3333-3333-3333-333333333333', 'DEPARTMENT_LEAD', 'Department Lead', 'Department-level approvals'),
    ('44444444-4444-4444-4444-444444444444', 'PROCUREMENT_OFFICER', 'Procurement Officer', 'Procurement processing'),
    ('55555555-5555-5555-5555-555555555555', 'USER', 'Regular User', 'Basic user access')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (id, code, name, description, resource, action)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'system.config', 'System Configuration', 'Manage RBAC and system configuration', 'system', 'config'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'request.create', 'Create Request', 'Create purchasing requests', 'request', 'create'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'request.submit', 'Submit Request', 'Submit purchasing requests for approval', 'request', 'submit'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'request.approve', 'Approve Request', 'Approve purchasing requests', 'request', 'approve'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'request.reject', 'Reject Request', 'Reject purchasing requests', 'request', 'reject'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'report.view', 'View Reports', 'View reports', 'report', 'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'report.export', 'Export Reports', 'Export reports', 'report', 'export')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM (
    VALUES
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'::uuid),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'::uuid),
        ('33333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid),
        ('33333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid),
        ('44444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid),
        ('55555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid),
        ('55555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid)
) AS seed(role_id, permission_id)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id,
       r.id
FROM users u
JOIN roles r
  ON r.code = CASE
      WHEN UPPER(u.role) = 'ROLE_ADMIN' THEN 'ADMIN'
      WHEN UPPER(u.role) = 'ROLE_USER' THEN 'USER'
      ELSE UPPER(u.role)
  END
ON CONFLICT (user_id, role_id) DO NOTHING;
