import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * ApiKeyInterceptor (DEPRECATED)
 * 
 * Chúng ta đã chuyển sang mô hình Public/Secret Key (RSA + AES).
 * API Key không còn được lưu ở Frontend để tránh lộ thông tin nhạy cảm.
 * 
 * Cơ chế bảo mật hiện tại:
 * 1. Hybrid Encryption (RSA + AES) cho nội dung request.
 * 2. JWT cho xác thực người dùng.
 * 3. Gateway (Nginx) có thể tự chèn API Key nếu cần (Server-to-Server).
 */
@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Không chèn x-api-key nữa
    return next.handle(req);
  }
}
