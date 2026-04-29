/* ─── Request Management Interfaces matching backend DTOs ─── */

export interface PurchaseItemDto {
  itemCode?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  specification?: string;
}

export interface CreateRequestDto {
  title: string;
  description?: string;
  departmentId?: number;
  costCenter?: string;
  currency?: string;
  items: PurchaseItemDto[];
}

/* ─── Response DTOs ─── */

export interface PurchaseItemResponse {
  id: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specification: string;
}

export interface ApprovalStepResponse {
  id: number;
  stepOrder: number;
  roleName: string;
  approver: string;
  status: string;
  comment: string;
  completedAt: string;
}

export interface PurchasingRequest {
  id: number;
  requestNumber: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedDate: string;
  status: RequestStatus;
  totalAmount: number;
  currency: string;
  departmentId: number;
  costCenter: string;
  items: PurchaseItemResponse[];
  approvalSteps: ApprovalStepResponse[];
  createdAt: string;
  createdBy: string;
}

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Department {
  id: number;
  code: string;
  name: string;
}

/** Status display config theo Design System */
export const STATUS_CONFIG: Record<RequestStatus, { label: string; bg: string; text: string }> = {
  DRAFT:            { label: 'Nháp',          bg: 'bg-blue-50',   text: 'text-blue-700' },
  SUBMITTED:        { label: 'Đã gửi',       bg: 'bg-blue-50',   text: 'text-blue-700' },
  PENDING_APPROVAL: { label: 'Chờ duyệt',    bg: 'bg-amber-50',  text: 'text-amber-700' },
  APPROVED:         { label: 'Đã duyệt',     bg: 'bg-green-50',  text: 'text-green-700' },
  REJECTED:         { label: 'Từ chối',       bg: 'bg-red-50',    text: 'text-red-700' },
  CANCELLED:        { label: 'Đã hủy',       bg: 'bg-slate-100', text: 'text-slate-600' },
};
