# USE CASES E2E - Purchasing Request Portal

Tai lieu nay mo ta day du cac use case chinh de trien khai du an end-to-end theo bo yeu cau trong `docs`.

## 1) Muc tieu nghiep vu
- So hoa quy trinh mua sam noi bo tu tao yeu cau den phe duyet, mua hang, doi soat va bao cao.
- Dam bao an toan: x-api-key, JWT, RBAC runtime, ma hoa payload, idempotency.
- Ho tro van hanh: log4j2, tracing, health check, docker resource limits.

## 2) Tac nhan he thong
- `Nhan vien` (Requester): tao/sua/gui yeu cau.
- `Truong bo phan` (Department Lead): phe duyet cap 1.
- `Tai chinh` (Finance Manager): phe duyet cap 2, kiem soat ngan sach.
- `Mua sam` (Procurement Officer): xu ly dat hang, nhan hang, doi soat hoa don.
- `Admin`: quan ly user/role/permission, cau hinh he thong.
- `System`: Gateway, Auth Service, Domain Service, Keycloak, Redis, Kafka, Camunda.

## 3) Use case nhom 
- Chi tiet cac use case trong docs/uscase
## 4) Luong ky thuat E2E bat buoc
- `x-api-key` phai duoc check truoc JWT.
- Request nhay cam dung AES-256-GCM.
- Token luu DB + Redis dong bo.
- Permission phai load runtime tu DB.
- Tat ca POST/PUT/PATCH dung `Idempotency-Key`.
- Log co `traceId/spanId`, khong log data nhay cam.

## 5) Backlog trien khai de hoan thanh du an

### Phase 1 - Foundation
1. Hoan tat migration SQL theo schema yeu cau (`users`, `roles`, `permissions`, `auth_tokens`, `purchasing_requests`, `purchase_items`, `approval_steps`).
2. Chuan hoa package clean architecture cho 3 service.
3. Tao app entrypoint (`@SpringBootApplication`) + health endpoints.

### Phase 2 - Auth Service MVP
1. Register + Login + Logout + single session.
2. JWT provider + token persistence + Redis cache.
3. RBAC runtime check.
4. Forgot/reset password.
5. 2FA enable/verify.

### Phase 3 - Domain Service MVP
1. Request CRUD + submit.
2. Approval chain + endpoint approve/reject.
3. Camunda workflow integration.
4. Kafka event publisher.

### Phase 4 - Gateway + Security
1. Gateway routes + filter order.
2. Rate limiting + request tracing.
3. Decrypt/encrypt pipeline.

### Phase 5 - Frontend MVP
1. Auth screens (login/register/2FA).
2. Request management screens.
3. Approval screens.
4. Report viewer.

### Phase 6 - Quality + Deploy
1. Unit test + integration test (TestContainers) >= 80%.
2. Docker compose healthy, resource limits day du.
3. Observability: log4j2 + OpenTelemetry.

## 9) Dinh nghia Hoan thanh (Definition of Done)
- Tat ca use case UC-AUTH, UC-REQ, UC-REP, UC-ADM chay duoc qua gateway.
- Test pass, khong vi pham rule bat buoc trong `docs/DEVELOPMENT-RULES.md`.
- Co du lieu seed va huong dan run local/docker cho team.
- Khong con endpoint critical dang placeholder.
