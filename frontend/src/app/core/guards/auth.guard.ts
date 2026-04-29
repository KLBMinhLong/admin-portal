import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * UC-FE-01 Task 3: AuthGuard
 *
 * Acceptance Criteria: "Auth guard chan route private khi chua login"
 * Functional guard (Angular 18 style) — không cần class.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login nếu chưa đăng nhập
  return router.createUrlTree(['/auth/login']);
};

/**
 * Guard ngược: chặn user đã login vào trang auth (login, register...)
 * → redirect về dashboard
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
