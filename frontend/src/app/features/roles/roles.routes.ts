import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: 'matrix',
    loadComponent: () =>
      import('./role-matrix/role-matrix.component').then((m) => m.RoleMatrixComponent),
    title: 'Phân quyền - Purchasing Portal',
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./audit-log/audit-log.component').then((m) => m.AuditLogComponent),
    title: 'Nhật ký Phân quyền - Purchasing Portal',
  },
  { path: '', redirectTo: 'matrix', pathMatch: 'full' },
];
