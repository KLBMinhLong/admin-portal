# UC-FE-03 - Frontend Approval va Report flow

## Goal
Hoan thien giao dien duyet yeu cau va xem/xuat bao cao.

## Actors
- Primary: Department Lead, Finance Manager, Admin
- Secondary: Angular ApprovalModule, ReportsModule, Domain API

## Preconditions
- User co role/permission phu hop.

## Trigger
- User vao menu Approval hoac Reports.

## Main Flow (Approval)
1. Lay danh sach request cho duyet.
2. Mo chi tiet request + approval chain.
3. Approve hoac Reject voi remarks.
4. Cap nhat danh sach sau xu ly.

## Main Flow (Reports)
1. Chon loai bao cao + bo loc.
2. Goi API report.
3. Preview PDF hoac tai file.

## Alternate Flows
- A1: Khong co du lieu -> hien thi empty state.
- A2: Permission thieu -> 403 page.
- A3: Report generation loi -> thong bao va cho retry.

## Edge Cases
- PDF lon -> stream/download thay vi render toan bo.
- Concurrent approve -> refresh state request sau action.

## Acceptance Criteria
- Approve/reject thao tac duoc va cap nhat dung trang thai.
- Report tai duoc, noi dung khong loi font/co ky tu dac biet.

## Implementation Tasks
1. Tao Approval list/detail/dialog components.
2. Tao Reports list/view/export components.
3. Tao route guards theo permission.
4. Viet tests cho approval actions.
