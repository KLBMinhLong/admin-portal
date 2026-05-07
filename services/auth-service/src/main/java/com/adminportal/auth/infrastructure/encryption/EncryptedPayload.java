package com.adminportal.auth.infrastructure.encryption;

/**
 * Payload chứa dữ liệu đã mã hóa.
 * Đối với mã hóa Hybrid:
 * - key: AES key đã được mã hóa bằng RSA Public Key.
 * - data: Dữ liệu JSON đã được mã hóa bằng AES key.
 * - iv: Initialization Vector dùng cho AES-GCM.
 */
public record EncryptedPayload(String data, String iv, String key) {
}
