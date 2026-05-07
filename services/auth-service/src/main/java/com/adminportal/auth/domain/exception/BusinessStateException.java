package com.adminportal.auth.domain.exception;

/**
 * Ném ra khi trạng thái nghiệp vụ không cho phép thực hiện hành động.
 * Ví dụ: User bị khóa, Token đã bị thu hồi, 2FA state thay đổi.
 * HTTP 422 - Unprocessable Entity
 */
public class BusinessStateException extends BaseBusinessException {
    public BusinessStateException(String message) {
        super("BUSINESS_STATE_ERROR", message);
    }

    public BusinessStateException(String code, String message) {
        super(code, message);
    }
}
