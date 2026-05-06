import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private level: LogLevel = LogLevel.DEBUG;

  constructor(private http: HttpClient) {
    this.setLevelFromEnv();
  }

  private setLevelFromEnv() {
    switch(environment.logging.level.toUpperCase()) {
      case 'DEBUG': this.level = LogLevel.DEBUG; break;
      case 'INFO': this.level = LogLevel.INFO; break;
      case 'WARN': this.level = LogLevel.WARN; break;
      case 'ERROR': this.level = LogLevel.ERROR; break;
      default: this.level = LogLevel.INFO;
    }
  }

  debug(message: string, context?: any) {
    if (this.level <= LogLevel.DEBUG) {
      this.formatAndLog('DEBUG', message, context);
    }
  }

  info(message: string, context?: any) {
    if (this.level <= LogLevel.INFO) {
      this.formatAndLog('INFO', message, context);
    }
  }

  warn(message: string, context?: any) {
    if (this.level <= LogLevel.WARN) {
      this.formatAndLog('WARN', message, context);
    }
  }

  error(message: string, error?: any, traceId?: string) {
    if (this.level <= LogLevel.ERROR) {
      this.formatAndLog('ERROR', message, error, traceId);
      
      if (environment.logging.sendErrorToServer) {
        this.sendToServer(message, error, traceId);
      }
    }
  }

  private formatAndLog(levelStr: string, message: string, data?: any, traceId?: string) {
    const timestamp = new Date().toISOString();
    let logMsg = `[${timestamp}] [${levelStr}] ${message}`;
    if (traceId) {
      logMsg += ` [TraceID: ${traceId}]`;
    }
    
    // Tự động bỏ qua các trường nhạy cảm nếu data là object
    const sanitizedData = this.sanitizeData(data);

    switch(levelStr) {
      case 'DEBUG':
        console.debug(logMsg, sanitizedData || '');
        break;
      case 'INFO':
        console.info(logMsg, sanitizedData || '');
        break;
      case 'WARN':
        console.warn(logMsg, sanitizedData || '');
        break;
      case 'ERROR':
        console.error(logMsg, sanitizedData || '');
        break;
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;
    
    // Copy object to avoid mutating original
    try {
      const copy = JSON.parse(JSON.stringify(data));
      const sensitiveKeys = ['password', 'token', 'secret', 'cvv', 'creditcard'];
      
      const cleanRecursive = (obj: any) => {
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
              obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
              cleanRecursive(obj[key]);
            }
          }
        }
      };
      
      cleanRecursive(copy);
      return copy;
    } catch {
      return data; // if circular or unparseable, just return it
    }
  }

  private sendToServer(message: string, error?: any, traceId?: string) {
    const payload = {
      message,
      stack: error instanceof Error ? error.stack : (error?.stack || null),
      url: window.location.href,
      userAgent: navigator.userAgent,
      traceId: traceId || null,
      timestamp: new Date().toISOString()
    };

    // Note: Use fire-and-forget for logs so it doesn't block UI or trigger further errors.
    this.http.post(`${environment.apiBaseUrl}/logs/error`, payload).subscribe({
      next: () => {},
      error: () => {} // Do not log error of log API to avoid infinite loop
    });
  }
}
