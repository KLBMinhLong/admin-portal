/**
 * EncryptionConfig - Cấu hình bật/tắt và khóa bí mật cho AES-GCM.
 */
export interface EncryptionConfig {
  enabled: boolean;
  secretKey: string;
}