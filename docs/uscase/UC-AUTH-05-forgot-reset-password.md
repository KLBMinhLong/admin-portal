# UC-AUTH-05 - Quen mat khau va dat lai

## Goal
Cho phep user doi mat khau an toan qua email reset link.

## Actors
- Primary: User quen mat khau
- Secondary: Auth Service, Email Service, PostgreSQL, Redis

## Preconditions
- Email da duoc dang ky.

## Triggers
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

## Main Flow (Forgot)
1. Nhan email.
2. Neu email ton tai: tao reset token hash + expiry (30 phut).
3. Luu token reset vao DB.
4. Gui email reset link.
5. Luon tra response chung de tranh email enumeration.

## Main Flow (Reset)
1. Nhan reset token + new password.
2. Verify token ton tai, chua het han, chua su dung.
3. Validate password policy.
4. Hash password moi.
5. Update user password + `password_changed_at`.
6. Invalidate tat ca token active cua user (DB + Redis).
7. Mark reset token da su dung.

## Alternate Flows
- A1: Token sai/het han -> `400 INVALID_RESET_TOKEN`.
- A2: Password khong dat policy -> `400 INVALID_PASSWORD_POLICY`.

## Edge Cases
- User request nhieu lan: chi token moi nhat hop le.
- Email service fail: retry queue.

## Acceptance Criteria
- Password cu khong con dung duoc.
- Tat ca session cu bi revoke.
- Reset token khong duoc tai su dung.

## Implementation Tasks
1. Tao bang `password_reset_tokens`.
2. Tao forgot/reset endpoints.
3. Them revoke-all-tokens service.
4. Viet test cho token expiry va one-time usage.
