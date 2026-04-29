package com.adminportal.domain.domain.exception;

/**
 * UC-SEC-02 Edge Case: Cùng key nhưng payload khác → conflict.
 */
public class IdempotencyPayloadMismatchException extends RuntimeException {
    public IdempotencyPayloadMismatchException(String key) {
        super("IDEMPOTENCY_PAYLOAD_MISMATCH: key=" + key);
    }
}
