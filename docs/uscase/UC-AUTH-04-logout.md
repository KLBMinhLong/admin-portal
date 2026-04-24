# UC-AUTH-04 - Dang xuat

## Goal
Ket thuc phien dang nhap hien tai bang cach revoke token trong DB va xoa cache Redis.

## Actors
- Primary: User da dang nhap
- Secondary: Auth Service, Redis, PostgreSQL

## Preconditions
- Header `x-api-key` hop le.
- Header `Authorization: Bearer <jwt>` hop le.

## Trigger
- `POST /api/v1/auth/logout`

## Main Flow
1. Nhan bearer token hien tai.
2. Parse `jti` tu JWT.
3. Tim token trong DB theo `jti`.
4. Neu token dang active -> set `is_active=false`, set `revoked_at`.
5. Xoa `token:{jti}` trong Redis.
6. Tra `204 No Content`.

## Alternate Flows
- A1: Token da bi revoke truoc do -> van tra `204 No Content`.
- A2: Token khong ton tai trong DB nhung parse duoc `jti` -> van xoa Redis neu co va tra `204 No Content`.
- A3: JWT khong hop le -> `401 INVALID_TOKEN`.

## Edge Cases
- Logout lap lai phai idempotent, khong throw exception.
- Redis fail: DB revoke van thanh cong, log can re-sync.
- Logout dong thoi voi login moi: DB la source of truth.

## Acceptance Criteria
- Token dang xuat khong con active trong DB.
- Cache Redis cua token bi xoa.
- Goi logout lap lai khong lam loi he thong.

## Implementation Tasks
1. Hardening `LogoutUseCase` theo huong idempotent.
2. Cap nhat endpoint logout va contract request.
3. Them test cho active token, inactive token, token khong ton tai.
4. Cap nhat danh sach UC auth trong `README.md`.
