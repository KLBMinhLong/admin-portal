import { Routes } from '@angular/router';

export const APPROVAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./approval-list/approval-list.component').then((m) => m.ApprovalListComponent),
    title: 'Phê duyệt - Purchasing Portal',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./approval-detail/approval-detail.component').then((m) => m.ApprovalDetailComponent),
    title: 'Chi tiết phê duyệt - Purchasing Portal',
  },
];
