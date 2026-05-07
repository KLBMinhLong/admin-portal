/**
 * EncryptedPayload - Contract giữa FE và BE
 */
export interface EncryptedPayload {
  /** Base64-encoded ciphertext (AES-GCM output bao gồm cả auth tag) */
  data: string;
  /** Base64-encoded IV (12 bytes) */
  iv: string;
  /** 
   * Base64-encoded AES Session Key (32 bytes) 
   * được mã hóa bởi RSA Public Key của Backend.
   * Chỉ dùng cho mã hóa Hybrid.
   */
  key?: string;
}
