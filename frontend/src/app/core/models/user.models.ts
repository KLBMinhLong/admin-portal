/**
 * UC-FE-04: Admin User Management models
 * Khớp với AdminUserDto từ auth-service
 */

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  active: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRoleRequest {
  role: string;
}

/** Config hiển thị trạng thái cho user */
export const USER_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: {
    label: 'Hoạt động',
    class: 'bg-green-50 text-green-700 border-green-200',
  },
  inactive: {
    label: 'Đã khóa',
    class: 'bg-red-50 text-red-700 border-red-200',
  },
};

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'DEPARTMENT_LEAD', label: 'Trưởng phòng' },
  { value: 'FINANCE_MANAGER', label: 'Quản lý tài chính' },
  { value: 'STAFF', label: 'Nhân viên' },
];
