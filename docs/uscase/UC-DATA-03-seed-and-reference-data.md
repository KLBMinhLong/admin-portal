# UC-DATA-03 - Seed va reference data

## Goal
Chuan hoa du lieu tham chieu de he thong chay duoc ngay sau khoi tao.

## Actors
- Primary: Backend developer, QA
- Secondary: PostgreSQL, Flyway

## Preconditions
- Schema core da migrate xong.

## Trigger
- Chay migration seed hoac script setup environment.

## Main Flow
1. Seed roles: ADMIN, FINANCE_MANAGER, DEPARTMENT_LEAD, PROCUREMENT_OFFICER, USER.
2. Seed permissions theo resource/action.
3. Seed role-permission mapping co ban.
4. Seed users test (dev only) voi password hash an toan.
5. Seed department/cost center reference (neu su dung).

## Alternate Flows
- A1: Seed trung -> su dung `ON CONFLICT DO NOTHING`.
- A2: Environment prod -> tat seed test users.

## Edge Cases
- Seed khac nhau theo env (`dev`, `docker`, `prod`).
- Tranh hardcode secret trong migration.

## Acceptance Criteria
- Moi role co du permission toi thieu theo docs.
- QA co user test de verify flow nhanh.

## Implementation Tasks
1. Tao `V3__seed_reference_data.sql` (hoac tiep theo version thuc te).
2. Tach seed dev/prod bang profile hoac script rieng.
3. Tao tai lieu mapping role-permission.
