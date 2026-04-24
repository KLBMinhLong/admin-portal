# UC-DEVOPS-01 - Docker va env deployment

## Goal
Chay duoc toan bo he thong bang Docker Compose voi cau hinh an toan va on dinh.

## Actors
- Primary: DevOps/Developer
- Secondary: Docker Engine, Docker Compose, cac services

## Preconditions
- Co `.env` hop le.
- Docker daemon dang chay.

## Trigger
- `docker compose up --build`

## Main Flow
1. Validate `.env` va bien bat buoc.
2. Build images cho auth/domain/gateway/frontend.
3. Start postgres, redis, kafka, keycloak.
4. Start backend services theo dependency health.
5. Start frontend.
6. Verify health checks tung service.

## Alternate Flows
- A1: Thieu env -> fail-fast voi message ro rang.
- A2: Port conflict -> stop va thong bao port can doi.
- A3: Service unhealthy -> log root cause, khong start chain tiep.

## Edge Cases
- Khac biet win/linux line ending trong script/init SQL.
- Tai nguyen may thap: can dieu chinh resource limits.

## Acceptance Criteria
- Tat ca container `healthy`.
- Frontend truy cap duoc qua port 80.
- API gateway tra duoc health endpoint.

## Implementation Tasks
1. Hoan thien `.env.template`.
2. Check lai `docker-compose.yml` resources/heathcheck.
3. Them startup verification script (optional).
4. Viet runbook deploy local.
