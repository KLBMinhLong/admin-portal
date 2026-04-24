# UC-OPS-01 - Observability va audit logging

## Goal
Dam bao co kha nang theo doi he thong, truy vet loi va audit hanh dong.

## Actors
- Primary: DevOps, Backend developer, Security auditor
- Secondary: Log4j2, OpenTelemetry, Monitoring stack

## Preconditions
- Cac service da su dung Log4j2.
- OTel exporter endpoint cau hinh dung.

## Trigger
- Moi request API va moi su kien nghiep vu quan trong.

## Main Flow
1. Gan `traceId/spanId` tu filter vao MDC.
2. Log request/response metadata (khong log secret).
3. Emit traces qua OpenTelemetry agent/exporter.
4. Ghi audit events:
   - login/logout
   - role assignment
   - approve/reject request
   - password reset
5. Ho tro tim kiem log theo traceId.

## Alternate Flows
- A1: OTel collector down -> app van chay, degrade graceful.
- A2: Log disk day -> rolling policy + retention.

## Edge Cases
- PII masking bat buoc cho email/phone neu can.
- Throughput cao: dung async appender tranh block request thread.

## Acceptance Criteria
- Moi request co traceId trong log.
- Co dashboard co ban: error rate, latency, throughput.
- Audit event truy vet duoc actor + action + timestamp.

## Implementation Tasks
1. Hoan thien `log4j2.xml` cho tung service.
2. Tao trace filter (MDC).
3. Cau hinh OTel trong Dockerfile/env.
4. Tao audit logger utility + integration tests.
