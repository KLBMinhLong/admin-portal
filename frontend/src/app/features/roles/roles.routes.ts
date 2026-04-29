import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: 'matrix',
    loadComponent: () =>
      import('./role-matrix/role-matrix.component').then((m) => m.RoleMatrixComponent),
    title: 'Ma trận Phân quyền - Purchasing Portal',
  },
  {
    path: 'management',
    loadComponent: () =>
      import('./role-list/role-list.component').then((m) => m.RoleListComponent),
    title: 'Quản lý Role - Purchasing Portal',
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./audit-log/audit-log.component').then((m) => m.AuditLogComponent),
    title: 'Nhật ký Phân quyền - Purchasing Portal',
  },
  { path: '', redirectTo: 'matrix', pathMatch: 'full' },
];
