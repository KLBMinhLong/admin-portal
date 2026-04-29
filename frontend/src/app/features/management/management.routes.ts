import { Routes } from '@angular/router';

export const MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./request-list/request-list.component').then((m) => m.RequestListComponent),
    title: 'Yêu cầu mua sắm - Purchasing Portal',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./request-create/request-create.component').then((m) => m.RequestCreateComponent),
    title: 'Tạo yêu cầu - Purchasing Portal',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./request-detail/request-detail.component').then((m) => m.RequestDetailComponent),
    title: 'Chi tiết yêu cầu - Purchasing Portal',
  },
];
