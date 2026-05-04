import { Routes } from '@angular/router';
import { roleManagementGuard } from '@core/guards/auth.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: 'matrix',
    canActivate: [roleManagementGuard],
    loadComponent: () =>
      import('./role-matrix/role-matrix.component').then((m) => m.RoleMatrixComponent),
    title: 'Ma trận Phân quyền - Purchasing Portal',
  },
  {
    path: 'management',
    canActivate: [roleManagementGuard],
    loadComponent: () =>
      import('./role-list/role-list.component').then((m) => m.RoleListComponent),
    title: 'Quản lý Role - Purchasing Portal',
  },
  {
    path: 'audit',
    canActivate: [roleManagementGuard],
    loadComponent: () =>
      import('./audit-log/audit-log.component').then((m) => m.AuditLogComponent),
    title: 'Nhật ký Phân quyền - Purchasing Portal',
  },
  { path: '', redirectTo: 'matrix', pathMatch: 'full' },
];
