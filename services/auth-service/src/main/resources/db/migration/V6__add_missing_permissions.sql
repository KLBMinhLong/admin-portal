

INSERT INTO permissions (id, code, name, description, resource, action)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'user.manage', 'Manage Users', 'View and edit user details and status', 'user', 'manage'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 'role.manage', 'Manage Roles', 'View and edit roles and permissions', 'role', 'manage')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM (
    VALUES
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8'::uuid),
        ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9'::uuid)
) AS seed(role_id, permission_id)
ON CONFLICT (role_id, permission_id) DO NOTHING;
