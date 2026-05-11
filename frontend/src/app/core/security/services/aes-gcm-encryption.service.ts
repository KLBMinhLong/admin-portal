import { Injectable, inject } from '@angular/core';
import { ENCRYPTION_CONFIG } from '../../tokens/config.token';
import { EncryptedPayload } from '../models/encrypted-payload.model';
import { CryptoUtils } from '../utils/crypto-utils';
import { LoggingService } from '../../services/logging.service';

/**
 * AES-256-GCM Encryption Service.
 *
 * Sử dụng Web Crypto API (SubtleCrypto) để đảm bảo tương thích
 * hoàn toàn với backend Java AesGcmEncryptionService:
 *
 *   - Algorithm:  AES-GCM
 *   - Key size:   256 bits (32 bytes UTF-8 → raw import)
 *   - IV length:  12 bytes (96 bits) – random mỗi lần encrypt
 *   - Tag length: 128 bits (mặc định của Web Crypto)
 */
@Injectable({ providedIn: 'root' })
export class AesGcmEncryptionService {
  private readonly COMPONENT_NAME = 'AesGcmEncryptionService';
  private readonly IV_LENGTH = 12;
  private readonly TAG_LENGTH_BITS = 128;

  private readonly enabled: boolean;
  private rawKeyBytes: ArrayBuffer | null;
  private cryptoKey: CryptoKey | null = null;

  constructor(private loggingService: LoggingService) {
    const config = inject(ENCRYPTION_CONFIG);
    this.enabled = config.enabled;
    this.rawKeyBytes = this.buildRawKeyBytes(config.secretKey);
  }

  /** Kiểm tra encryption có được bật không */
  isEnabled(): boolean {
    return this.enabled && this.rawKeyBytes !== null;
  }

  /**
   * Encrypt plaintext → EncryptedPayload { data, iv }
   * Tương thích với backend AesGcmEncryptionService.decrypt(data, iv)
   */
  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    try {
      this.ensureCanEncrypt();
      this.assertPlaintext(plaintext);

      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const plaintextBytes = CryptoUtils.encodeUtf8(plaintext);

      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: this.TAG_LENGTH_BITS },
        key,
        plaintextBytes,
      );

      return {
        data: CryptoUtils.arrayBufferToBase64(cipherBuffer),
        iv: CryptoUtils.arrayBufferToBase64(iv.buffer),
      };
    } catch (error) {
      throw this.handleFailure('encrypt', error);
    }
  }

  /**
   * Decrypt EncryptedPayload → plaintext string
   * Tương thích với backend AesGcmEncryptionService.encrypt(plaintext)
   */
  async decrypt(payload: EncryptedPayload): Promise<string> {
    try {
      this.ensureCanEncrypt();
      this.assertEncryptedPayload(payload);

      const key = await this.getKey();
      const ivBuffer = CryptoUtils.base64ToArrayBuffer(payload.iv);
      if (new Uint8Array(ivBuffer).length !== this.IV_LENGTH) {
        throw new Error('INVALID_ENCRYPTED_PAYLOAD: IV must be 12 bytes');
      }

      const ciphertextBuffer = CryptoUtils.base64ToArrayBuffer(payload.data);
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer, tagLength: this.TAG_LENGTH_BITS },
        key,
        ciphertextBuffer,
      );
      return CryptoUtils.decodeUtf8(plainBuffer);
    } catch (error) {
      throw this.handleFailure('decrypt', error);
    }
  }

  destroy(): void {
    this.cryptoKey = null;
    this.rawKeyBytes = null;
  }

  // ─── Private helpers ───────────────────────────────────────

  private buildRawKeyBytes(secretKey: string): ArrayBuffer | null {
    if (!this.enabled || !secretKey) {
      return null;
    }

    const secretKeyBytes = CryptoUtils.encodeUtf8(secretKey);
    const secretBytes = new Uint8Array(secretKeyBytes);
    if (secretBytes.length !== 32) {
      this.loggingService.error(`[${this.COMPONENT_NAME}] Secret key must be exactly 32 bytes. Got: ${secretBytes.length}`);
      return null;
    }

    return secretKeyBytes;
  }

  private ensureCanEncrypt(): void {
    if (!this.isEnabled()) {
      throw new Error('ENCRYPTION_DISABLED: encryption is not available');
    }
  }

  private assertPlaintext(plaintext: unknown): asserts plaintext is string {
    if (typeof plaintext !== 'string') {
      throw new Error('INVALID_PLAINTEXT: plaintext must be a string');
    }

    if (CryptoUtils.isEmptyText(plaintext)) {
      throw new Error('INVALID_PLAINTEXT: plaintext cannot be empty');
    }
  }

  private assertEncryptedPayload(payload: unknown): asserts payload is EncryptedPayload {
    if (!CryptoUtils.isValidEncryptedPayload(payload)) {
      throw new Error('INVALID_ENCRYPTED_PAYLOAD: payload must contain data and iv');
    }
  }

  private handleFailure(operation: 'encrypt' | 'decrypt', error: unknown): Error {
    const normalizedError = error instanceof Error ? error.message : String(error);
    this.loggingService.error(`[${this.COMPONENT_NAME}] Failed to ${operation}`, error);
    return new Error(`${this.COMPONENT_NAME}.${operation.toUpperCase()}_FAILED: ${normalizedError}`);
  }

  /**
   * Lazy-init CryptoKey từ raw bytes.
   * Web Crypto yêu cầu import key trước khi dùng.
   */
  private async getKey(): Promise<CryptoKey> {
    if (this.cryptoKey) {
      return this.cryptoKey;
    }
    if (!this.rawKeyBytes) {
      throw new Error('ENCRYPTION_CONFIG_ERROR: No valid secret key');
    }
    this.cryptoKey = await crypto.subtle.importKey(
      'raw',
      this.rawKeyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
    return this.cryptoKey;
  }
}