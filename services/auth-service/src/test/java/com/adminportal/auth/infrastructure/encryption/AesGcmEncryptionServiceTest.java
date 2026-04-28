package com.adminportal.auth.infrastructure.encryption;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AesGcmEncryptionServiceTest {

    private static final String SECRET = "encryptkey_changeme_32chars_1234";

    @Test
    void shouldEncryptAndDecryptRoundTrip() {
        AesGcmEncryptionService service = new AesGcmEncryptionService(properties());

        EncryptedPayload payload = service.encrypt("hello-world");
        String decrypted = service.decrypt(payload.data(), payload.iv());

        assertEquals("hello-world", decrypted);
    }

    @Test
    void shouldFailOnTagMismatch() {
        AesGcmEncryptionService service = new AesGcmEncryptionService(properties());

        EncryptedPayload payload = service.encrypt("tamper");
        String tampered = tamper(payload.data());

        assertThrows(DecryptionFailedException.class, () -> service.decrypt(tampered, payload.iv()));
    }

    private EncryptionProperties properties() {
        EncryptionProperties properties = new EncryptionProperties();
        properties.setEnabled(true);
        properties.setSecretKey(SECRET);
        return properties;
    }

    private String tamper(String data) {
        byte[] bytes = Base64.getDecoder().decode(data);
        bytes[0] = (byte) (bytes[0] ^ 0x01);
        return Base64.getEncoder().encodeToString(bytes);
    }
}
