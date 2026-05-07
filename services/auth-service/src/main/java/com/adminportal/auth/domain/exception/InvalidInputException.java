package com.adminportal.auth.domain.exception;

/**
 * Ném ra khi dữ liệu đầu vào không hợp lệ (validation failed).
 * HTTP 400 - Bad Request
 */
public class InvalidInputException extends BaseBusinessException {
    public InvalidInputException(String message) {
        super("INVALID_INPUT", message);
    }
}
