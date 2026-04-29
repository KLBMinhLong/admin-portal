import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
    title: 'Đăng nhập - Purchasing Portal',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
    title: 'Đăng ký - Purchasing Portal',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    title: 'Quên mật khẩu - Purchasing Portal',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    title: 'Đặt lại mật khẩu - Purchasing Portal',
  },
  {
    path: 'verify-2fa',
    loadComponent: () =>
      import('./verify-2fa/verify-2fa.component').then(
        (m) => m.Verify2faComponent,
      ),
    title: 'Xác thực 2FA - Purchasing Portal',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
