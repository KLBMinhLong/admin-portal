export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  active: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRoleOption {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface CreateAdminUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  roleCode: string;
  active: boolean;
}

export interface UpdateAdminUserRequest {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface UpdateAdminUserRoleRequest {
  roleCode: string;
}

export const USER_STATUS_CONFIG: Record<'active' | 'inactive', { label: string; class: string }> = {
  active: {
    label: 'Hoạt động',
    class: 'bg-green-50 text-green-700 border-green-200',
  },
  inactive: {
    label: 'Đã khóa',
    class: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function formatRoleCode(roleCode: string | null | undefined): string {
  if (!roleCode) {
    return 'Chưa gán role';
  }

  return roleCode
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
