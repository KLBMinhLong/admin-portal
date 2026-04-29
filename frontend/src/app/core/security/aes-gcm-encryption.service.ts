import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { EncryptedPayload } from './encrypted-payload.model';

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
 *
 * Lưu ý quan trọng:
 *   Java Cipher.doFinal() trả về ciphertext || authTag (nối liền).
 *   Web Crypto cũng trả về ciphertext || authTag (nối liền).
 *   → Hai bên tương thích 1:1, không cần tách/nối tag thủ công.
 */
@Injectable({ providedIn: 'root' })
export class AesGcmEncryptionService {
  private readonly IV_LENGTH = 12;
  private readonly TAG_LENGTH_BITS = 128;

  private readonly enabled: boolean;
  private readonly rawKeyBytes: Uint8Array | null;
  private cryptoKey: CryptoKey | null = null;

  constructor() {
    this.enabled = environment.encryption?.enabled ?? false;
    if (this.enabled && environment.encryption?.secretKey) {
      this.rawKeyBytes = new TextEncoder().encode(environment.encryption.secretKey);
      if (this.rawKeyBytes.length !== 32) {
        console.error('[AesGcmEncryptionService] Secret key must be exactly 32 bytes. Got:', this.rawKeyBytes.length);
        this.rawKeyBytes = null;
      }
    } else {
      this.rawKeyBytes = null;
    }
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
    const key = await this.getKey();

    // Tạo IV ngẫu nhiên 12 bytes
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    // Encode plaintext → UTF-8 bytes
    const plaintextBytes = new TextEncoder().encode(plaintext);

    // AES-GCM encrypt (output = ciphertext || authTag, giống Java)
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: this.TAG_LENGTH_BITS },
      key,
      plaintextBytes,
    );

    return {
      data: this.arrayBufferToBase64(cipherBuffer),
      iv: this.arrayBufferToBase64(iv.buffer),
    };
  }

  /**
   * Decrypt EncryptedPayload → plaintext string
   * Tương thích với backend AesGcmEncryptionService.encrypt(plaintext)
   */
  async decrypt(payload: EncryptedPayload): Promise<string> {
    const key = await this.getKey();

    const iv = this.base64ToUint8Array(payload.iv);
    if (iv.length !== this.IV_LENGTH) {
      throw new Error('INVALID_ENCRYPTED_PAYLOAD: IV must be 12 bytes');
    }

    const ciphertext = this.base64ToUint8Array(payload.data);

    try {
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: this.TAG_LENGTH_BITS },
        key,
        ciphertext,
      );
      return new TextDecoder().decode(plainBuffer);
    } catch (err) {
      throw new Error('DECRYPTION_FAILED: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  // ─── Private helpers ───────────────────────────────────────

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
      false,            // không cho phép export key
      ['encrypt', 'decrypt'],
    );
    return this.cryptoKey;
  }

  /** ArrayBuffer / TypedArray → Base64 string */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  /** Base64 string → Uint8Array */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
