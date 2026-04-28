package com.adminportal.domain.infrastructure.encryption;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AesGcmEncryptionService {

    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final EncryptionProperties properties;
    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesGcmEncryptionService(EncryptionProperties properties) {
        this.properties = properties;
        this.secretKey = properties.isEnabled() ? buildSecretKey(properties.getSecretKey()) : null;
    }

    public EncryptedPayload encrypt(String plaintext) {
        assertEnabled();
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(properties.getAlgorithm());
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            return new EncryptedPayload(
                Base64.getEncoder().encodeToString(ciphertext),
                Base64.getEncoder().encodeToString(iv)
            );
        } catch (GeneralSecurityException exception) {
            throw new EncryptionConfigException("ENCRYPTION_CONFIG_ERROR", exception);
        }
    }

    public String decrypt(String data, String iv) {
        assertEnabled();
        try {
            byte[] ivBytes = Base64.getDecoder().decode(iv);
            if (ivBytes.length != IV_LENGTH_BYTES) {
                throw new InvalidEncryptedPayloadException("INVALID_ENCRYPTED_PAYLOAD");
            }
            byte[] ciphertext = Base64.getDecoder().decode(data);

            Cipher cipher = Cipher.getInstance(properties.getAlgorithm());
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, ivBytes));
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            throw new InvalidEncryptedPayloadException("INVALID_ENCRYPTED_PAYLOAD", exception);
        } catch (GeneralSecurityException exception) {
            throw new DecryptionFailedException("DECRYPTION_FAILED", exception);
        }
    }

    private void assertEnabled() {
        if (!properties.isEnabled()) {
            throw new EncryptionConfigException("ENCRYPTION_CONFIG_ERROR");
        }
    }

    private SecretKey buildSecretKey(String secret) {
        if (secret == null) {
            throw new EncryptionConfigException("ENCRYPTION_CONFIG_ERROR");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length != 32) {
            throw new EncryptionConfigException("ENCRYPTION_CONFIG_ERROR");
        }
        return new SecretKeySpec(keyBytes, "AES");
    }
}
