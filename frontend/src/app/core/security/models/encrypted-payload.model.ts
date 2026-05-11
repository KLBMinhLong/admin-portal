/**
 * EncryptedPayload - Contract giữa FE và BE.
 * Khớp với record EncryptedPayload(String data, String iv) ở backend.
 */
export interface EncryptedPayload {
  /** Base64-encoded ciphertext (AES-GCM output bao gồm cả auth tag) */
  data: string;
  /** Base64-encoded IV (12 bytes) */
  iv: string;
}