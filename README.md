# Admin Portal - Microservice Backend

Banking Intern Project - Rebuilt theo ghi chu lead.

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | Angular, SCSS, TailwindCSS, Bootstrap, MDI |
| Backend     | Java 21, Spring Boot 3.3, Spring Security |
| Persistence | Spring Data JPA, Hibernate, MyBatis |
| Database    | PostgreSQL 16 |
| SSO         | Keycloak 24 (custom provider, PostgreSQL backend) |
| Workflow    | Camunda BPMN 7 |
| Reporting   | Jasper Reports 7 |
| Cache       | Redis 7 |
| Messaging   | Apache Kafka 3.7 (KRaft mode) |
| Logging     | Log4j2 custom XML layout (Logback da bi loai bo) |
| Tracing     | OpenTelemetry Java Agent |
| Infra       | Docker, Docker Compose |

## Auth Flow (theo ghi chu lead)

  FE -> BE (username+password) -> Keycloak (custom provider verify)
  Keycloak -> OK -> BE
  BE: mint token {username, role} (khong co permission)
      -> save token DB + Redis (sync)
      -> revoke old token (single session)
      -> return token to FE

  FE (moi request) -> BE: kiem tra token vs DB/Redis
                         -> lay permission tu DB (RBAC)
                         -> chay business logic

  FE logout / dang nhap thiet bi khac:
  BE -> cam co active=false cho token cu

## Quick Start

  # 1. Clone repo
  git clone <repo-url> && cd admin-portal

  # 2. Tao .env
  cp .env.template .env
  # Chinh sua .env voi gia tri that

  # 3. Build va chay
  docker compose up --build

## Ports

| Service        | Port |
|----------------|------|
| Frontend       | 80   |
| API Gateway    | 8000 |
| Auth Service   | 8081 |
| Domain Service | 8082 |
| Keycloak       | 8080 |
| PostgreSQL     | 5432 |
| Redis          | 6379 |
| Kafka          | 9092 |

## Key Notes (tu ghi chu lead)

1. Clean Architecture: Infrastructure -> Application -> Domain
   Dependency luon di vao trong, khong bao gio nguoc lai

2. Object Mapper: MapStruct (khong dung ModelMapper - performance)

3. Log4j2: Logback da bi loai bo. Custom layout tai:
   src/main/resources/log4j2/log4j2.xml
   Include traceId/spanId tu OpenTelemetry MDC

4. OpenTelemetry: Attach via -javaagent trong Dockerfile

5. x-api-key: Header "x-api-key" kiem tra truoc JWT

6. Token Strategy:
   - Chi chua username + role (khong co permission)
   - Khong het han (never-expire)
   - Revoke bang active=false trong DB + evict Redis
   - 1 active token per user (single session)
   - Login moi -> revoke token cu tu dong

7. RBAC:
   - Role luu trong token (dinh danh)
   - Permission load tu DB luc runtime (khong trong token)

8. Encryption: AES/GCM/NoPadding cho request/response

9. Docker resource limits: deploy.resources.limits per service
