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

  return authService.ensureSessionLoaded().pipe(
    map((loaded) => {
      if (loaded && authService.isAuthenticated()) {
        return true;
      }
      // Redirect to login nếu chưa đăng nhập hoặc load thất bại
      return router.createUrlTree(['/auth/login']);
    }),
  );
};

/**
 * Guard ngược: chặn user đã login vào trang auth (login, register...)
 * → redirect về dashboard
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureSessionLoaded().pipe(
    map((loaded) => {
      if (loaded && authService.isAuthenticated()) {
        return router.createUrlTree(['/dashboard']);
      }
      return true;
    }),
  );
};

function permissionGuard(requiredAuthorities: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.ensureSessionLoaded().pipe(
      map((loaded) => {
        if (loaded && authService.isAuthenticated()) {
          return authService.hasAllAuthorities(requiredAuthorities)
            ? true
            : router.createUrlTree(['/forbidden']);
        }
        return router.createUrlTree(['/auth/login']);
      }),
    );
  };
}

export const userManagementGuard = permissionGuard(['system.config', 'user.manage']);
export const roleManagementGuard = permissionGuard(['system.config', 'role.manage']);
