-- ============================================================
-- V2: Add View-only permissions and assign to ADMIN
-- ============================================================

-- 1. Insert new permissions
INSERT INTO auth.permissions (id, code, name, description, resource, action) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb1', 'request.view',    'View Requests',        'View purchasing requests list and details', 'request', 'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb2', 'role.view',       'View Roles',           'View roles and their permissions',          'role',    'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb3', 'permission.view', 'View Permissions',     'View list of all permissions',             'permission', 'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb4', 'audit.view',      'View Audit Logs',      'View RBAC audit logs',                      'audit',   'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb5', 'dashboard.view',  'View Dashboard',       'View dashboard summary and charts',        'dashboard', 'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb6', 'user.view',       'View Users',           'View list of users and their profiles',    'user',    'view'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbb7', 'user.status',     'Manage User Status',   'Lock or unlock user accounts',             'user',    'status')
ON CONFLICT (code) DO NOTHING;

-- 2. Assign to ADMIN role
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, id 
FROM auth.permissions 
WHERE code IN ('request.view', 'role.view', 'permission.view', 'audit.view', 'dashboard.view', 'user.view', 'user.status')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Assign dashboard.view to all roles
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT id, (SELECT id FROM auth.permissions WHERE code = 'dashboard.view')
FROM auth.roles
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Assign to other roles who might need view access
-- FINANCE_MANAGER and DEPARTMENT_LEAD should see requests
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222'::uuid, id FROM auth.permissions WHERE code = 'request.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333'::uuid, id FROM auth.permissions WHERE code = 'request.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- USER should see their own requests (but the permission is just 'request.view' at API level)
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555'::uuid, id FROM auth.permissions WHERE code = 'request.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
