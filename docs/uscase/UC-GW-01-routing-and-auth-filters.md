# UC-GW-01 - Gateway routing va auth filters

## Goal
Gateway dinh tuyen request dung service va enforce chuoi filter bao mat.

## Actors
- Primary: Frontend client
- Secondary: Gateway Service, Auth Service, Domain Service

## Preconditions
- Gateway da co route config.
- Auth/Domain service healthy.

## Trigger
- Moi request vao `/api/v1/**`.

## Main Flow
1. Nhan request vao Gateway.
2. Validate `x-api-key` truoc.
3. Validate JWT (bo qua endpoint public auth theo config).
4. Gan traceId/spanId cho request.
5. Apply rate limit theo user/IP.
6. Route:
   - `/api/v1/auth/**` -> auth-service
   - `/api/v1/requests/**`, `/api/v1/approvals/**`, `/api/v1/reports/**` -> domain-service
7. Tra response nguoc ve client.

## Alternate Flows
- A1: Sai api key -> `401 INVALID_API_KEY`.
- A2: JWT invalid/revoked -> `401 INVALID_TOKEN`.
- A3: Vuot rate limit -> `429 TOO_MANY_REQUESTS`.
- A4: Service down -> `502 BAD_GATEWAY`.

## Edge Cases
- Request timeout khi downstream cham -> co timeout + retry policy hop ly.
- Public endpoint dang ky/dang nhap phai bypass JWT nhung van check api-key.

## Acceptance Criteria
- Thu tu filter dung: api-key -> jwt -> rate-limit -> route.
- Log co traceId cho moi request.
- Response error format thong nhat.

## Implementation Tasks
1. Tao `ApiKeyFilter`, `JwtFilter`, `TraceFilter`, `RateLimitFilter`.
2. Cau hinh route trong `application.yml`.
3. Them integration test cho route + unauthorized cases.
