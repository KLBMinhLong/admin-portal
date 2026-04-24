# UC-QA-01 - Testing strategy va quality gates

## Goal
Dam bao chat luong du an truoc khi merge/release.

## Actors
- Primary: Developer, QA
- Secondary: CI pipeline, TestContainers

## Preconditions
- Test framework da cau hinh.
- Co test database/cache setup.

## Trigger
- Truoc merge PR va truoc release.

## Main Flow
1. Chay unit tests cho auth/domain/gateway/frontend.
2. Chay integration tests voi TestContainers (PostgreSQL, Redis).
3. Chay API tests cho auth/request/approval/report.
4. Chay security tests:
   - api-key validation
   - jwt revoke
   - permission runtime
   - idempotency
5. Chay performance smoke test.
6. Verify coverage >= 80% backend logic.
7. CI pass thi moi cho merge.

## Alternate Flows
- A1: Test fail -> chan merge, tao bug ticket.
- A2: Test flaky -> danh dau quarantine tam thoi + fix priority.

## Edge Cases
- Test phu thuoc thoi gian (2FA/token) -> can fake clock.
- Test idempotency/canh tranh -> can concurrent test cases.

## Acceptance Criteria
- Khong con regression o luong nghiep vu chinh.
- Bao cao coverage dat nguong.
- Build artifact tao thanh cong.

## Implementation Tasks
1. Tao test plan matrix theo use case.
2. Them integration tests quan trong nhat.
3. Cau hinh CI jobs: build, test, quality gate.
4. Tao checklist release.
