package com.adminportal.domain.domain.exception;

/**
 * UC-SEC-02 A2: Cùng idempotency key đang được xử lý bởi request khác.
 */
public class IdempotencyInProgressException extends RuntimeException {
    public IdempotencyInProgressException(String key) {
        super("REQUEST_IN_PROGRESS: key=" + key);
    }
}
