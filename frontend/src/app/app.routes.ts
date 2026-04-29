import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  // Lazy-load features khi cần
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  // },
];
