# UC-REQ-03 - Phe duyet / Tu choi yeu cau

## Goal
Cho phep approver duyet hoac tu choi request theo approval chain.

## Actors
- Primary: Department Lead, Finance Manager
- Secondary: Domain Service, Camunda, Kafka

## Preconditions
- Request dang `PENDING`.
- User hien tai la approver hop le cua step hien tai.

## Triggers
- `POST /api/v1/approvals/{requestId}/approve`
- `POST /api/v1/approvals/{requestId}/reject`

## Main Flow (Approve)
1. Verify permission `request.approve`.
2. Tim approval step pending cua user.
3. Cap nhat step -> `APPROVED`.
4. Neu con step tiep theo -> giu request `PENDING`.
5. Neu la step cuoi -> request `APPROVED`.
6. Update Camunda task/process.
7. Publish event `REQUEST_APPROVED` hoac `STEP_APPROVED`.

## Main Flow (Reject)
1. Verify permission `request.reject`.
2. Cap nhat step -> `REJECTED`.
3. Cap nhat request -> `REJECTED`.
4. Dong workflow.
5. Publish event `REQUEST_REJECTED`.

## Alternate Flows
- A1: User khong dung approver -> `403 NOT_CURRENT_APPROVER`.
- A2: Step da xu ly -> `409 STEP_ALREADY_PROCESSED`.
- A3: Request khong o `PENDING` -> `409 INVALID_STATUS`.

## Edge Cases
- 2 approver click cung luc: dung optimistic lock/version.
- Reject can ly do: enforce `remarks` khong rong.

## Acceptance Criteria
- Moi step chi xu ly 1 lan.
- Lich su phe duyet luu day du remarks, approvedAt.
- Request ket thuc dung trang thai.

## Implementation Tasks
1. Tao approve/reject DTO + endpoint.
2. Tao service xu ly step state machine.
3. Them lock/co che tranh race condition.
4. Viet test dong thoi approve.
