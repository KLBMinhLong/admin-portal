import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  /* ─── Auth pages (guest only) ─── */
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth-layout.component').then((m) => m.AuthLayoutComponent),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  /* ─── Protected pages (inside Shell layout with sidebar) ─── */
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard - Purchasing Portal',
      },
      {
        path: 'requests',
        loadChildren: () =>
          import('./features/management/management.routes').then((m) => m.MANAGEMENT_ROUTES),
      },
      {
        path: 'approvals',
        loadChildren: () =>
          import('./features/approval/approval.routes').then((m) => m.APPROVAL_ROUTES),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
        title: 'Báo cáo - Purchasing Portal',
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./shared/components/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
        title: '403 - Purchasing Portal',
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  /* ─── Fallback ─── */
  { path: '**', redirectTo: 'auth/login' },
];
