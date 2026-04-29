package com.adminportal.auth.infrastructure.encryption;

public class EncryptionConfigException extends RuntimeException {

    public EncryptionConfigException(String message) {
        super(message);
    }

    public EncryptionConfigException(String message, Throwable cause) {
        super(message, cause);
    }
}
