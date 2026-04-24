# UC-DATA-02 - Domain schema migrations

## Goal
Khoi tao migration cho purchasing request workflow data model.

## Actors
- Primary: Backend developer
- Secondary: Flyway, PostgreSQL

## Preconditions
- Domain service da cau hinh Flyway.

## Trigger
- Chay domain-service lan dau hoac migrate command.

## Main Flow
1. Tao migration cho bang:
   - `purchasing_requests`
   - `purchase_items`
   - `approval_steps`
2. Tao khoa ngoai va index:
   - request_number unique
   - status index
   - request_id index cho items/steps
3. Tao audit columns `created_at`, `updated_at`, `created_by`, `updated_by`.
4. Verify schema validate pass.

## Alternate Flows
- A1: Constraint fail do du lieu cu -> migration pre-cleanup.
- A2: Enum thay doi -> migration alter enum an toan.

## Edge Cases
- Monetary precision: dung `DECIMAL(19,4)` hoac theo policy.
- Column nullable phai ro rang theo business.

## Acceptance Criteria
- CRUD request va approval khong loi schema.
- Query list/filter co index support.

## Implementation Tasks
1. Tao `V1__domain_core_tables.sql`.
2. Tao `V2__domain_indexes.sql`.
3. Tao integration test repository voi TestContainers.
