package com.adminportal.domain.infrastructure.encryption;

public class InvalidEncryptedPayloadException extends RuntimeException {

    public InvalidEncryptedPayloadException(String message) {
        super(message);
    }

    public InvalidEncryptedPayloadException(String message, Throwable cause) {
        super(message, cause);
    }
}
