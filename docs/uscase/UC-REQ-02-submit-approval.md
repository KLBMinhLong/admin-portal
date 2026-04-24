# UC-REQ-02 - Submit yeu cau sang quy trinh phe duyet

## Goal
Chuyen request tu `DRAFT` sang `PENDING` va khoi tao approval workflow.

## Actors
- Primary: Requester
- Secondary: Domain Service, Camunda, Kafka

## Preconditions
- Request ton tai va dang `DRAFT`.
- User la owner hoac co quyen submit.

## Trigger
- `POST /api/v1/requests/{id}/submit`

## Main Flow
1. Kiem tra request status = `DRAFT`.
2. Validate request data day du truoc submit.
3. Tao approval chain mac dinh:
   - Step 1: Department Lead
   - Step 2: Finance Manager
4. Update request status -> `PENDING`.
5. Start Camunda process instance.
6. Publish event `REQUEST_SUBMITTED`.
7. Tra ket qua submit.

## Alternate Flows
- A1: Request khong ton tai -> `404 REQUEST_NOT_FOUND`.
- A2: Request da submit -> `409 INVALID_STATUS_TRANSITION`.
- A3: Camunda fail -> rollback transaction va tra `500 WORKFLOW_START_FAILED`.

## Edge Cases
- Submit lai do FE retry: can idempotency cho submit operation.
- Khong tim thay approver theo role: dua vao queue admin resolve.

## Acceptance Criteria
- Sau submit, status request la `PENDING`.
- Approval steps duoc tao day du.
- Camunda process co business key = requestId.

## Implementation Tasks
1. Tao endpoint submit.
2. Tao `ApprovalStep` entity + repository.
3. Tao `WorkflowService.initiateApprovalWorkflow`.
4. Viet integration test status transition.
