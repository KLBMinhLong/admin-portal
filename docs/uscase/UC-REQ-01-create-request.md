# UC-REQ-01 - Tao yeu cau mua sam

## Goal
Tao moi purchasing request o trang thai `DRAFT` voi danh sach item hop le.

## Actors
- Primary: Requester (User)
- Secondary: Domain Service, PostgreSQL, Kafka

## Preconditions
- User da authenticated.
- Co permission `request.create`.
- Co `Idempotency-Key`.

## Trigger
- `POST /api/v1/requests`

## Main Flow
1. Gateway validate `x-api-key` + JWT.
2. Domain check idempotency key.
3. Validate input DTO.
4. Validate business rules (it nhat 1 item, total > 0).
5. Sinh `requestNumber` theo format `PR-YYYY-XXX`.
6. Tinh tong tien tu item details.
7. Luu `purchasing_requests` + `purchase_items`.
8. Publish Kafka event `REQUEST_CREATED`.
9. Tra `201` + payload request vua tao.

## Alternate Flows
- A1: Idempotency key trung -> tra ket qua cu.
- A2: Khong du quyen -> `403 ACCESS_DENIED`.
- A3: Du lieu item sai -> `400 INVALID_ITEMS`.

## Edge Cases
- Gia tri tien te khac nhau trong 1 request -> reject hoac normalize theo rule.
- Request duplicate do timeout FE -> phai tra cung response idempotent.

## Acceptance Criteria
- Request duoc tao duy nhat 1 lan voi cung idempotency key.
- Tong tien trong DB khop tong item.
- Co audit `created_by`, `created_at`.

## Implementation Tasks
1. Tao entities `PurchasingRequest`, `PurchaseItem`.
2. Tao mapper va create DTO.
3. Tao idempotency service.
4. Tao create endpoint + service.
5. Viet test idempotent create.
