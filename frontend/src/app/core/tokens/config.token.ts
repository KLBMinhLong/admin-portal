import { InjectionToken } from '@angular/core';
import { environment } from '@env/environment';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl
});

/**
 * Cấu hình mã hóa.
 * Lưu ý: secretKey hiện tại chỉ dùng để GIẢI MÃ (Inbound) từ backend.
 * Việc MÃ HÓA (Outbound) đã chuyển sang HybridEncryptionService sử dụng RSA.
 */
export const ENCRYPTION_CONFIG = new InjectionToken<{enabled: boolean, secretKey: string}>('ENCRYPTION_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    enabled: environment.encryption?.enabled ?? false,
    secretKey: environment.encryption?.secretKey || 'default_local_storage_key_32ch!'
  })
});

// API_KEY đã được loại bỏ để bảo mật theo mô hình Public/Secret Key.

export const LOGGING_CONFIG = new InjectionToken<{level: string, sendErrorToServer: boolean}>('LOGGING_CONFIG', {
  providedIn: 'root',
  factory: () => environment.logging
});
