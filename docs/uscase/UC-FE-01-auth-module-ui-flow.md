# UC-FE-01 - Frontend Auth module flow

## Goal
Hoan thien UI/UX cho login, register, forgot/reset password, 2FA.

## Actors
- Primary: End user
- Secondary: Angular AuthModule, Gateway/Auth API

## Preconditions
- Frontend da bootstrap Angular app.
- Co config base API URL gateway.

## Trigger
- User truy cap trang auth.

## Main Flow
1. User mo trang login.
2. Nhap credentials -> goi `/api/v1/auth/login`.
3. Neu yeu cau 2FA -> dieu huong trang verify OTP.
4. Verify thanh cong -> luu token secure + chuyen dashboard.
5. Register flow co validate client-side + server-side message map.
6. Forgot/reset flow ho tro email link.

## Alternate Flows
- A1: API 401 -> hien thi thong bao sai thong tin.
- A2: API 403 user inactive -> hien thi message lien he admin.
- A3: API 429 -> thong bao thu lai sau.

## Edge Cases
- Token het hieu luc/revoked -> auto logout + redirect login.
- Refresh trang khi dang o 2FA -> giu challenge state hop le.

## Acceptance Criteria
- Auth guard chan route private khi chua login.
- HTTP interceptor auto add `x-api-key` + `Authorization`.
- UI thong nhat thong diep loi theo ma code backend.

## Implementation Tasks
1. Tao `AuthModule` + components: login/register/forgot/reset/2fa.
2. Tao `AuthService` + `AuthStateStore`.
3. Tao `AuthInterceptor` va `AuthGuard`.
4. Viet unit test cho auth service va guard.
