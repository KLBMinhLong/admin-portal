# UC-AUTH-02 - Dang nhap 1 phien

## Goal
Dang nhap user, tao JWT moi, revoke token cu de dam bao single-session.

## Actors
- Primary: User da dang ky
- Secondary: Auth Service, Keycloak, Redis, PostgreSQL

## Preconditions
- User ton tai, `is_active=true`.
- Header `x-api-key` hop le.

## Trigger
- `POST /api/v1/auth/login`

## Main Flow
1. Validate request schema.
2. Xac minh thong tin dang nhap.
3. Goi Keycloak custom provider de double-check.
4. Neu user bat 2FA -> tra challenge (ket thuc flow dang nhap buoc 1).
5. Tim token dang active cua user.
6. Revoke tat ca token cu trong DB (`is_active=false`).
7. Xoa token cu trong Redis.
8. Tao JWT moi (co `jti`, khong chua permissions).
9. Luu token vao `auth_tokens`.
10. Cache `token:{jti}` vao Redis.
11. Tra response token + user profile.

## Alternate Flows
- A1: Sai thong tin -> `401 INVALID_CREDENTIALS`.
- A2: User inactive -> `403 USER_INACTIVE`.
- A3: Keycloak khong available -> `503 AUTH_PROVIDER_UNAVAILABLE`.

## Edge Cases
- Dang nhap dong thoi 2 request: can transaction + lock de tranh 2 token active.
- Redis fail: van cho login neu DB save thanh cong, danh dau can re-sync.

## Acceptance Criteria
- Moi user chi co 1 token active sau login.
- Redis va DB du lieu token nhat quan.
- JWT payload co `username`, `role`, `userId`, `jti`.

## Implementation Tasks
1. Hoan thien `login()` use case va transaction boundary.
2. Tao service revoke token cu.
3. Tao/hoan thien `JwtProvider`.
4. Tao token cache service.
5. Viet integration test single-session.
