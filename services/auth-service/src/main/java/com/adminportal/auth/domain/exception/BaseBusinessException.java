package com.adminportal.auth.domain.exception;

/**
 * Base class cho tất cả Business Exception trong hệ thống.
 * Các exception nghiệp vụ cụ thể phải extend từ class này.
 */
public abstract class BaseBusinessException extends RuntimeException {

    private final String code;

    protected BaseBusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    protected BaseBusinessException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
