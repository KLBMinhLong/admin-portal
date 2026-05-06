import { InjectionToken } from '@angular/core';
import { environment } from '@env/environment';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl
});

export const ENCRYPTION_CONFIG = new InjectionToken<{enabled: boolean, secretKey: string}>('ENCRYPTION_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    enabled: environment.encryption?.enabled ?? false,
    secretKey: environment.encryption?.secretKey || 'default_local_storage_key_32ch!'
  })
});

export const API_KEY = new InjectionToken<string>('API_KEY', {
  providedIn: 'root',
  factory: () => environment.apiKey || ''
});

export const LOGGING_CONFIG = new InjectionToken<{level: string, sendErrorToServer: boolean}>('LOGGING_CONFIG', {
  providedIn: 'root',
  factory: () => environment.logging
});
