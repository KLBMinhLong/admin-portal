# UC-ADM-01 - Quan ly RBAC (Role va Permission)

## Goal
Cho phep admin gan role cho user va cau hinh role-permission.

## Actors
- Primary: Admin
- Secondary: Auth Service, PostgreSQL

## Preconditions
- Admin da dang nhap.
- Co permission he thong (`system.config` hoac tuong duong).

## Triggers
- `POST /api/v1/admin/users/{id}/roles`
- `POST /api/v1/admin/roles/{id}/permissions`
- `GET /api/v1/admin/users/{id}/permissions`

## Main Flow
1. Admin chon user.
2. Gan 1 hoac nhieu role vao `user_roles`.
3. Cap nhat mapping role-permission neu can.
4. He thong ghi audit (`assigned_by`, `assigned_at`).
5. Request tiep theo cua user se duoc check permission runtime tu DB.

## Alternate Flows
- A1: Role/permission khong ton tai -> `404`.
- A2: Role da gan -> bo qua hoac tra `409` theo policy.
- A3: Admin khong du quyen -> `403`.

## Edge Cases
- Thu hoi role dang duoc su dung: can policy migration permission.
- Cache permission neu co -> bat buoc invalidate sau update.

## Acceptance Criteria
- User nhan role moi co quyen ngay o request tiep theo.
- Khong can re-login neu policy cho phep runtime load.
- Lich su thay doi role truy vet duoc.

## Implementation Tasks
1. Tao admin RBAC endpoints.
2. Tao service map user-role va role-permission.
3. Tao audit logging cho RBAC change.
4. Viet test runtime permission update.
