# UC-AUTH-01 - Dang ky tai khoan

## Goal
Tao tai khoan user moi an toan trong bang `users`, gui email verify.

## Actors
- Primary: User chua co tai khoan
- Secondary: Auth Service, Email Service, PostgreSQL

## Preconditions
- `username` va `email` chua ton tai.
- Header `x-api-key` hop le.

## Trigger
- `POST /api/v1/auth/register`

## Request Contract
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@12345",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Main Flow
1. Gateway validate `x-api-key`.
2. Controller validate schema (`@Valid`).
3. Service validate policy password (>=12, upper/lower/number/special).
4. Kiem tra unique username/email.
5. Hash password bang bcrypt (12 rounds tro len).
6. Tao user (`is_email_verified=false`, `is_active=true`).
7. Persist DB.
8. Tao verification token va gui email.
9. Tra response success.

## Alternate Flows
- A1: Username da ton tai -> `409 USERNAME_EXISTS`.
- A2: Email da ton tai -> `409 EMAIL_EXISTS`.
- A3: Password khong dat policy -> `400 INVALID_PASSWORD_POLICY`.

## Edge Cases
- Input co uppercase email -> normalize lowercase truoc khi save.
- Email service fail -> user van tao, danh dau trang thai `PENDING_EMAIL_RETRY`.

## Acceptance Criteria
- User moi co mat trong DB.
- Password khong luu plain text.
- Response khong chua password hash.
- Co log audit tao user (khong log secret).

## Implementation Tasks
1. Tao DTO `RegisterRequestDto` + validation annotations.
2. Tao `PasswordService.validatePassword()`.
3. Tao `AuthApplicationService.register()`.
4. Tao repository check unique.
5. Tao email verification service.
6. Viet unit test cho success + 3 case fail.
