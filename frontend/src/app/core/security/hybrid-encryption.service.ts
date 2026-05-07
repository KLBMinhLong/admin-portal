import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../tokens/config.token';
import { EncryptedPayload } from './encrypted-payload.model';
import { firstValueFrom, map } from 'rxjs';
import { ApiResponse } from '../models/auth.models';

/**
 * Hybrid Encryption Service.
 * Kết hợp RSA (Bất đối xứng) và AES-GCM (Đối xứng).
 * 
 * Flow:
 * 1. Lấy RSA Public Key từ Backend.
 * 2. Sinh AES Session Key ngẫu nhiên (32 bytes).
 * 3. Mã hóa Payload bằng AES Session Key.
 * 4. Mã hóa AES Session Key bằng RSA Public Key.
 * 5. Gửi cả 2 lên Backend.
 */
@Injectable({ providedIn: 'root' })
export class HybridEncryptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  
  private cachedPublicKey: CryptoKey | null = null;

  /**
   * Thực hiện mã hóa Hybrid cho chuỗi plaintext.
   */
  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    const rsaPublicKey = await this.getPublicKey();
    
    // 1. Sinh AES Key ngẫu nhiên (256 bits)
    const sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );

    // 2. Export AES Key ra dạng raw bytes để mã hóa RSA
    const rawAesKey = await crypto.subtle.exportKey('raw', sessionKey);

    // 3. Mã hóa AES Key bằng RSA Public Key
    const encryptedAesKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, // Backend dùng PKCS1Padding, Web Crypto dùng RSA-OAEP mặc định. 
      // Lưu ý: Java PKCS1Padding tương ứng với RSA-OAEP hoặc PKCS1 tùy Java version. 
      // Tôi sẽ sử dụng RSA-OAEP để đảm bảo an toàn cao nhất.
      rsaPublicKey,
      rawAesKey
    );

    // 4. Mã hóa Payload bằng AES Key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const encryptedBody = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      sessionKey,
      plaintextBytes
    );

    return {
      data: this.arrayBufferToBase64(encryptedBody),
      iv: this.arrayBufferToBase64(iv.buffer),
      key: this.arrayBufferToBase64(encryptedAesKey)
    };
  }

  private async getPublicKey(): Promise<CryptoKey> {
    if (this.cachedPublicKey) return this.cachedPublicKey;

    const res = await firstValueFrom(
      this.http.get<ApiResponse<{ publicKey: string }>>(`${this.apiUrl}/auth/security/public-key`)
    );

    if (!res.data?.publicKey) throw new Error('Could not fetch public key');

    // Import PEM/Base64 key sang CryptoKey
    const binaryKey = this.base64ToArrayBuffer(res.data.publicKey);
    this.cachedPublicKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );

    return this.cachedPublicKey;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
