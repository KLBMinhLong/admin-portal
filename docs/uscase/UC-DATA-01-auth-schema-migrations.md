# UC-DATA-01 - Auth schema migrations

## Goal
Khoi tao day du schema va migration cho auth domain theo yeu cau.

## Actors
- Primary: Backend developer
- Secondary: Flyway, PostgreSQL

## Preconditions
- Auth service da cau hinh Flyway.
- DB ket noi duoc.

## Trigger
- Chay auth-service lan dau hoac `mvn flyway:migrate`.

## Main Flow
1. Tao migration versioned cho bang:
   - `users`
   - `roles`
   - `permissions`
   - `user_roles`
   - `role_permissions`
   - `auth_tokens`
   - `password_reset_tokens`
2. Tao index bat buoc:
   - users(username/email/active)
   - auth_tokens(user_id,is_active) + token_jti
3. Seed role/permission mac dinh.
4. Verify migration history trong `flyway_schema_history`.

## Alternate Flows
- A1: Migration conflict version -> doi soat numbering va checksum.
- A2: Table ton tai sai schema -> tao migration corrective.

## Edge Cases
- Ho tro rollback logic bang migration fix-forward.
- Data lon: can migration khong khoa bang qua lau.

## Acceptance Criteria
- Database co day du bang auth theo docs requirements.
- Auth service start thanh cong voi `ddl-auto=validate`.

## Implementation Tasks
1. Tao file `V1__auth_core_tables.sql`.
2. Tao file `V2__auth_indexes_constraints.sql`.
3. Tao file `V3__seed_roles_permissions.sql`.
4. Tao test startup verify migration.
