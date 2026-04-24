# Frontend App Skeleton

Muc tieu file nay la danh dau khoi tao bo khung module cho Angular app.

## Module can tao tiep
- auth
- dashboard
- request-management
- approval
- reports
- shared

## Quy uoc
- Tat ca API call di qua `gateway-service` (`/api/v1/*`).
- Bat buoc gui `x-api-key`, `Authorization`, `Idempotency-Key` (voi POST/PUT/PATCH).
- Response nhay cam can decrypt theo chuan AES-GCM.
