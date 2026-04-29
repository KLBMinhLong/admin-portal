import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { ApiKeyInterceptor } from './core/interceptors/api-key.interceptor';
import { IdempotencyInterceptor } from './core/interceptors/idempotency.interceptor';
import { EncryptionInterceptor } from './core/interceptors/encryption.interceptor';

/**
 * App configuration (standalone Angular 18).
 *
 * Thứ tự interceptor quan trọng (cho REQUEST):
 *   1. ApiKeyInterceptor      – gắn header x-api-key
 *   2. IdempotencyInterceptor – sinh Idempotency-Key cho POST/PUT/PATCH
 *   3. EncryptionInterceptor  – encrypt body (request) / decrypt body (response)
 *
 * Interceptor chạy theo thứ tự khai báo cho REQUEST,
 * và ngược lại cho RESPONSE.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),

    // Interceptor chain
    { provide: HTTP_INTERCEPTORS, useClass: ApiKeyInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: IdempotencyInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: EncryptionInterceptor, multi: true },
  ],
};
