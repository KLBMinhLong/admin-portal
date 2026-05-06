import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { API_KEY } from '../tokens/config.token';

/**
 * Interceptor tự động gắn header x-api-key cho mọi request
 * đến các endpoint /api/* (Rule 13 trong DEVELOPMENT-RULES).
 */
@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  private apiKey = inject(API_KEY);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const cloned = req.clone({
      setHeaders: {
        'x-api-key': this.apiKey,
      },
    });
    return next.handle(cloned);
  }
}
