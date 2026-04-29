import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * UC-SEC-02: Tự động sinh và gắn Idempotency-Key header cho các request
 * ghi dữ liệu (POST / PUT / PATCH).
 *
 * Key được sinh bằng crypto.randomUUID() (UUID v4) đảm bảo tính duy nhất.
 *
 * Nếu request đã có header Idempotency-Key (do dev tự truyền), interceptor
 * sẽ không ghi đè.
 */
@Injectable()
export class IdempotencyInterceptor implements HttpInterceptor {
  private readonly WRITE_METHODS = ['POST', 'PUT', 'PATCH'];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Chỉ gắn cho các method ghi dữ liệu
    if (!this.WRITE_METHODS.includes(req.method)) {
      return next.handle(req);
    }

    // Chỉ gắn cho endpoint API, bỏ qua static resource
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    // Nếu caller đã set sẵn → không ghi đè
    if (req.headers.has('Idempotency-Key')) {
      return next.handle(req);
    }

    const cloned = req.clone({
      setHeaders: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    });
    return next.handle(cloned);
  }
}
