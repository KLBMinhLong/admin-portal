import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggingService } from '../services/logging.service';

@Injectable() 
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private loggingService: LoggingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Không log gọi API báo lỗi để tránh infinite loop
    if (request.url.includes('/logs/error')) {
      return next.handle(request);
    }

    // Gắn traceId vào header
    let traceId = request.headers.get('X-Trace-Id') || request.headers.get('traceparent');
    if (!traceId) {
      traceId = crypto.randomUUID();
      request = request.clone({
        setHeaders: { 'X-Trace-Id': traceId }
      });
    }

    const startTime = Date.now();
    
    // Log request start (Không log body để tránh lộ PII, chỉ log hành động nghiệp vụ)
    this.loggingService.info(`[API Request] ${request.method} ${request.urlWithParams}`);

    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          this.loggingService.info(`[API Response] ${request.method} ${request.urlWithParams} - Status: ${event.status} (${duration}ms)`);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;
        let serverTraceId = error.headers?.get('X-Trace-Id') || traceId;
        
        if (error.status === 401 || error.status === 403) {
          this.loggingService.warn(`[API Auth Error] ${request.method} ${request.urlWithParams} - Status: ${error.status} (${duration}ms)`, null);
        } else {
          // Chỉ lấy traceId từ lỗi để log cho backend dễ trace
          this.loggingService.error(`[API Error] ${request.method} ${request.urlWithParams} - Status: ${error.status} (${duration}ms)`, error, serverTraceId!);
        }

        return throwError(() => error);
      })
    );
  }
}
