import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
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
    return authService.ensureSessionLoaded().pipe(
      map((loaded) => loaded ? true : router.createUrlTree(['/auth/login'])),
    );
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

function permissionGuard(requiredAuthorities: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    return authService.ensureSessionLoaded().pipe(
      map((loaded) => {
        if (!loaded) {
          return router.createUrlTree(['/auth/login']);
        }

        return authService.hasAllAuthorities(requiredAuthorities)
          ? true
          : router.createUrlTree(['/forbidden']);
      }),
    );
  };
}

export const userManagementGuard = permissionGuard(['system.config', 'user.manage']);
export const roleManagementGuard = permissionGuard(['system.config', 'role.manage']);
