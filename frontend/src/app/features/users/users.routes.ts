import { Routes } from '@angular/router';
import { userManagementGuard } from '@core/guards/auth.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [userManagementGuard],
    loadComponent: () =>
      import('./user-list/user-list.component').then((m) => m.UserListComponent),
    title: 'Quản lý người dùng - Purchasing Portal',
  },
  {
    path: ':id',
    canActivate: [userManagementGuard],
    loadComponent: () =>
      import('./user-detail/user-detail.component').then((m) => m.UserDetailComponent),
    title: 'Chi tiết người dùng - Purchasing Portal',
  },
];
