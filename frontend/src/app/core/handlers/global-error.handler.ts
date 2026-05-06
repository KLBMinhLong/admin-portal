import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggingService } from '../services/logging.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    // Dùng Injector để lấy LoggingService bên trong hàm, tránh lỗi circular dependency (nếu có)
    const loggingService = this.injector.get(LoggingService);

    let message = 'An unexpected error occurred';
    let traceId: string | undefined;

    if (error instanceof HttpErrorResponse) {
      // Lỗi HTTP, trích xuất thông tin
      message = `HTTP Error: ${error.status} ${error.statusText} - ${error.url}`;
      // Lấy traceId từ backend nếu có trả về
      if (error.headers && error.headers.get('X-Trace-Id')) {
        traceId = error.headers.get('X-Trace-Id') || undefined;
      } else if (error.error && error.error.traceId) {
        traceId = error.error.traceId;
      }
    } else if (error instanceof Error) {
      // Lỗi JavaScript Runtime
      message = error.message;
    } else {
      // Lỗi không xác định
      message = error?.toString() || 'Unknown error';
    }

    loggingService.error(`[GlobalErrorHandler] ${message}`, error, traceId);
  }
}
