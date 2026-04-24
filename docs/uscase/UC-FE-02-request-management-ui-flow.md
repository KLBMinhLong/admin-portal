# UC-FE-02 - Frontend Request management flow

## Goal
Cung cap man hinh tao/sua/submit/tra cuu purchasing request.

## Actors
- Primary: Requester
- Secondary: Angular RequestManagementModule, Domain API

## Preconditions
- User da login.
- Co permission lien quan request.

## Trigger
- User vao menu "Purchasing Requests".

## Main Flow
1. Hien thi danh sach request co filter + pagination.
2. User tao request moi (form dynamic items).
3. Validate client-side.
4. Gui create request kem `Idempotency-Key`.
5. Hien thi detail request.
6. User submit request -> status `PENDING`.

## Alternate Flows
- A1: Validation fail -> show inline errors.
- A2: API reject vi permission -> show forbidden page.
- A3: Duplicate submit do retry -> handle idempotent response.

## Edge Cases
- Form item lon -> toi uu performance render.
- Mat mang giua chung -> luu tam draft local.

## Acceptance Criteria
- Danh sach filter dung theo status/date.
- Tao request xong hien thi request number.
- Submit thanh cong cap nhat status real-time hoac sau refresh.

## Implementation Tasks
1. Tao components: list/create/edit/detail.
2. Tao `RequestService` + models.
3. Tao reusable form item component.
4. Viet component tests cho form validation.
