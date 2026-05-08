import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';
import { AesGcmEncryptionService } from '../security/aes-gcm-encryption.service';
import { EncryptedPayload } from '../security/encrypted-payload.model';

/**
 * HTTP Interceptor tự động:
 *   1. Encrypt request body trước khi gửi đi (POST/PUT/PATCH)
 *   2. Decrypt response body khi nhận về
 *
 * Chỉ xử lý khi:
 *   - Encryption được bật trong environment
 *   - Request đến các endpoint /api/v1/* (endpoint nhạy cảm)
 *   - Bỏ qua health check, static resources
 *
 * Contract payload: { "data": "base64_ciphertext", "iv": "base64_iv" }
 * Khớp với EncryptionRequestBodyAdvice / EncryptionResponseBodyAdvice ở backend.
 */
@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {
  /** Các endpoint KHÔNG cần mã hóa */
  private readonly SKIP_PATTERNS = [
    '/health',
    '/actuator',
    '/assets/',
    '/camunda/',
    '/engine-rest/',
  ];

  constructor(private encryptionService: AesGcmEncryptionService) { }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Nếu encryption tắt hoặc URL không cần mã hóa → gửi thẳng
    if (!this.encryptionService.isEnabled() || this.shouldSkip(req.url)) {
      return next.handle(req);
    }

    // Chỉ encrypt body cho các method có body
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body != null;

    if (hasBody) {
      return this.encryptAndSend(req, next);
    }

    // GET, DELETE → không encrypt request, nhưng vẫn decrypt response
    return next.handle(req).pipe(
      switchMap((event) => this.decryptResponseIfNeeded(event)),
    );
  }

  /**
   * Encrypt request body → gửi → decrypt response
   */
  private encryptAndSend(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const bodyJson = JSON.stringify(req.body);

    return from(this.encryptionService.encrypt(bodyJson)).pipe(
      switchMap((encryptedPayload: EncryptedPayload) => {
        // Tạo request mới với body đã mã hóa
        const encryptedReq = req.clone({
          body: encryptedPayload,
          setHeaders: { 'Content-Type': 'application/json' },
        });
        return next.handle(encryptedReq);
      }),
      switchMap((event) => this.decryptResponseIfNeeded(event)),
    );
  }

  /**
   * Decrypt response body nếu nó có dạng EncryptedPayload { data, iv }
   */
  private decryptResponseIfNeeded(event: HttpEvent<unknown>): Observable<HttpEvent<unknown>> {
    if (!(event instanceof HttpResponse)) {
      return from([event]);
    }

    const body = event.body;

    // Kiểm tra body có phải EncryptedPayload không
    if (!this.isEncryptedPayload(body)) {
      return from([event]);
    }

    return from(this.encryptionService.decrypt(body as EncryptedPayload)).pipe(
      map((plaintext: string) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(plaintext);
        } catch {
          parsed = plaintext;
        }
        return event.clone({ body: parsed });
      }),
    );
  }

  /**
   * Kiểm tra object có đúng dạng { data: string, iv: string } không
   */
  private isEncryptedPayload(body: unknown): body is EncryptedPayload {
    if (body == null || typeof body !== 'object') return false;
    const obj = body as Record<string, unknown>;
    return (
      typeof obj['data'] === 'string' &&
      typeof obj['iv'] === 'string' &&
      Object.keys(obj).length === 2
    );
  }

  /**
   * Các URL khớp pattern → bỏ qua encryption
   */
  private shouldSkip(url: string): boolean {
    return this.SKIP_PATTERNS.some((pattern) => url.includes(pattern));
  }
}
