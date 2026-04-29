import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

/**
 * UC-FE-01 Task 3: AuthInterceptor
 *
 * - Tự động gắn header `Authorization: Bearer <token>` cho mọi request API
 * - Nếu response 401 → auto logout + redirect login
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.token();

    // Không gắn token cho các endpoint public (login, register, forgot, reset)
    const isPublicAuth =
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/forgot-password') ||
      req.url.includes('/auth/reset-password') ||
      req.url.includes('/auth/verify-2fa');

    let authReq = req;
    if (token && !isPublicAuth) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Edge Case: Token hết hiệu lực / revoked → auto logout
        if (error.status === 401 && !isPublicAuth) {
          this.authService.logout();
        }
        return throwError(() => error);
      }),
    );
  }
}
