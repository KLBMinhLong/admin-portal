package com.adminportal.auth.infrastructure.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Quản lý mã hóa RSA (Bất đối xứng).
 * Dùng để giải mã AES Key được gửi từ Frontend.
 */
@Component
@Slf4j
public class RsaEncryptionService {

    private final PrivateKey privateKey;
    private final String publicKeyBase64;

    public RsaEncryptionService(@Value("${app.security.rsa.private-key}") String privateKeyStr,
                                @Value("${app.security.rsa.public-key}") String publicKeyStr) {
        try {
            this.privateKey = loadPrivateKey(privateKeyStr);
            this.publicKeyBase64 = publicKeyStr;
            log.info("RSA Encryption Service initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize RSA keys", e);
            throw new RuntimeException("Security initialization failed", e);
        }
    }

    public String getPublicKey() {
        return publicKeyBase64;
    }

    /**
     * Giải mã dữ liệu bằng Private Key (RSA).
     */
    public byte[] decrypt(String encryptedData) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.DECRYPT_MODE, privateKey);
        return cipher.doFinal(Base64.getDecoder().decode(encryptedData));
    }

    private PrivateKey loadPrivateKey(String keyStr) throws Exception {
        String cleanKey = keyStr
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] keyBytes = Base64.getDecoder().decode(cleanKey);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }
}
