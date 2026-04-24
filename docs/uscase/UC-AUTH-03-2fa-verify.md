# UC-AUTH-03 - Xac minh 2FA (TOTP)

## Goal
Xac thuc OTP sau buoc password de hoan tat dang nhap.

## Actors
- Primary: User co 2FA enabled
- Secondary: Auth Service, Redis

## Preconditions
- User da bat 2FA.
- Da co challenge hop le (TTL 5 phut).

## Trigger
- `POST /api/v1/auth/verify-2fa`

## Request Contract
```json
{
  "challenge": "2fa_challenge_xxx",
  "otp": "123456"
}
```

## Main Flow
1. Kiem tra challenge ton tai trong Redis.
2. Tai user context tu challenge.
3. Verify OTP voi secret TOTP cua user.
4. OTP hop le -> tao JWT moi.
5. Revoke token cu neu co.
6. Save token vao DB + Redis.
7. Xoa challenge.
8. Tra login success response.

## Alternate Flows
- A1: Challenge het han -> `401 2FA_CHALLENGE_EXPIRED`.
- A2: OTP sai -> `401 INVALID_2FA_OTP`.
- A3: User tat 2FA trong luc xu ly -> `409 2FA_STATE_CHANGED`.

## Edge Cases
- Gio he thong lech -> cho phep 1 time-window truoc/sau.
- OTP dung 1 lan, khong cho replay.

## Acceptance Criteria
- Khong co token duoc cap neu OTP sai.
- Challenge bi xoa sau khi verify thanh cong.
- Co audit log 2FA success/fail.

## Implementation Tasks
1. Tao `TwoFactorService.verifyOtp()`.
2. Tao `ChallengeStore` tren Redis.
3. Them endpoint verify-2fa.
4. Them test cho challenge expired, otp invalid, success.
