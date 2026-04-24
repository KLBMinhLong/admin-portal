# UC-SEC-02 - Kiem soat idempotency key

## Goal
Dam bao request ghi du lieu (POST/PUT/PATCH) khong bi thuc thi lap.

## Actors
- Primary: Frontend client
- Secondary: Auth/Domain services, Redis/PostgreSQL

## Preconditions
- Header `Idempotency-Key` duoc gui voi request ghi du lieu.

## Trigger
- POST/PUT/PATCH endpoint.

## Main Flow
1. Nhan `Idempotency-Key`.
2. Tra cuu record da xu ly chua.
3. Neu da co ket qua hop le -> tra lai ket qua cu.
4. Neu chua co -> lock key.
5. Thuc thi business logic.
6. Luu response snapshot + metadata (TTL 24h).
7. Tra response moi.

## Alternate Flows
- A1: Thieu key -> `400 MISSING_IDEMPOTENCY_KEY`.
- A2: Key dang duoc xu ly -> `409 REQUEST_IN_PROGRESS`.
- A3: Loi trong xu ly -> luu trang thai fail co kiem soat (tuy policy).

## Edge Cases
- Cung key nhung payload khac: tra `409 IDEMPOTENCY_PAYLOAD_MISMATCH`.
- Redis mat ket noi: fallback DB hoac reject safe mode.

## Acceptance Criteria
- Cung key + cung payload chi tao 1 ban ghi nghiep vu.
- Request retry tra cung response business id.
- Co cleanup record het han.

## Implementation Tasks
1. Tao idempotency table/cache schema.
2. Tao middleware/service `executeIdempotent`.
3. Gan middleware vao toan bo endpoint ghi du lieu.
4. Viet test retry timeout scenario.
