# UC-CI-01 - Build va test pipeline

## Goal
Tao CI pipeline tu dong build va test cho toan bo services/frontend.

## Actors
- Primary: DevOps, Developer
- Secondary: GitHub Actions (hoac CI tool tuong duong)

## Preconditions
- Repo da co scripts build/test on local.

## Trigger
- Pull request mo moi hoac push commit len branch.

## Main Flow
1. Checkout source code.
2. Setup Java 21 + Node 20.
3. Cache Maven/NPM dependencies.
4. Build:
   - auth-service
   - domain-service
   - gateway-service
   - frontend
5. Run tests:
   - unit tests backend
   - frontend tests
6. Publish test reports/artifacts.
7. Danh dau pass/fail cho PR.

## Alternate Flows
- A1: Build fail 1 module -> fail fast va report module loi.
- A2: Test timeout -> split jobs/parallellize.

## Edge Cases
- Flaky integration tests: retry policy co gioi han.
- Monorepo path filters de tranh chay job khong can thiet.

## Acceptance Criteria
- PR khong duoc merge neu build/test fail.
- Co report ro file/test loi.

## Implementation Tasks
1. Tao workflow `ci-build-test.yml`.
2. Tach jobs backend/frontend.
3. Them badge/status check tren README.
