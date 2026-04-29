import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-list/user-list.component').then((m) => m.UserListComponent),
    title: 'Quản lý người dùng - Purchasing Portal',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-detail/user-detail.component').then((m) => m.UserDetailComponent),
    title: 'Chi tiết người dùng - Purchasing Portal',
  },
];
