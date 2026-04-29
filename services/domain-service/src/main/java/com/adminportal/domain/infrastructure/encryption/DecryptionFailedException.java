package com.adminportal.domain.infrastructure.encryption;

public class DecryptionFailedException extends RuntimeException {

    public DecryptionFailedException(String message) {
        super(message);
    }

    public DecryptionFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
