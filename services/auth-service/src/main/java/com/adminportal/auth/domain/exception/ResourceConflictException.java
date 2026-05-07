package com.adminportal.auth.domain.exception;

/**
 * Exception ném khi có xung đột tài nguyên.
 * Ví dụ: tạo tài khoản nhưng username đã tồn tại.
 */
public class ResourceConflictException extends BaseBusinessException {
    public ResourceConflictException(String message) {
        super("RESOURCE_CONFLICT", message);
    }
}
