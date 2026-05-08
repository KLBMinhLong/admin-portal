package com.adminportal.auth.infrastructure.web;

import com.adminportal.auth.domain.exception.BaseBusinessException;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.InvalidInputException;
import com.adminportal.auth.domain.exception.ResourceConflictException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import com.adminportal.auth.infrastructure.encryption.DecryptionFailedException;
import com.adminportal.auth.infrastructure.encryption.EncryptionConfigException;
import com.adminportal.auth.infrastructure.encryption.InvalidEncryptedPayloadException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler - chuyển exception thành HTTP response có ý nghĩa.
 * Tuân thủ BACKEND-LOGGING-EXCEPTION-RULES:
 * - Business Exception (4xx) → log WARN
 * - System Exception (5xx) → log ERROR kèm stacktrace
 * - Response luôn chứa: timestamp, status, error, message, code, traceId
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Business Exceptions (4xx) → log WARN ──

    @ExceptionHandler(BaseBusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BaseBusinessException ex) {
        HttpStatus status = resolveStatus(ex);
        String message = ex.getMessage();
        
        if ("USER_INACTIVE".equals(ex.getCode())) {
            message = "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
        } else if ("CANNOT_TOGGLE_ADMIN_ROLE".equals(ex.getCode())) {
            message = "Không thể vô hiệu hóa vai trò Quản trị viên hệ thống.";
        } else if ("CANNOT_REMOVE_ADMIN_ROLE_FROM_SELF".equals(ex.getCode())) {
            message = "Bạn không thể tự gỡ bỏ vai trò Quản trị viên của chính mình.";
        }
        
        log.warn("[Business] {}: {}", ex.getCode(), ex.getMessage());
        return buildResponse(status, message, ex.getCode());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        log.warn("[Validation] Bad request: {}", ex.getMessage());
        String message = ex.getMessage();
        String code = "BAD_REQUEST";

        if ("Invalid credentials".equalsIgnoreCase(message)) {
            message = "Sai tên đăng nhập hoặc mật khẩu.";
            code = "INVALID_CREDENTIALS";
        }

        return buildResponse(HttpStatus.BAD_REQUEST, message, code);
    }

    @ExceptionHandler(InvalidEncryptedPayloadException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidEncryptedPayload(InvalidEncryptedPayloadException ex) {
        log.warn("[Encryption] Invalid encrypted payload: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "INVALID_ENCRYPTED_PAYLOAD");
    }

    @ExceptionHandler(DecryptionFailedException.class)
    public ResponseEntity<Map<String, Object>> handleDecryptionFailed(DecryptionFailedException ex) {
        log.warn("[Encryption] Decryption failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "DECRYPTION_FAILED");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(AccessDeniedException ex) {
        log.warn("[Security] Access denied: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), "ACCESS_DENIED");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("Validation failed");
        log.warn("[Validation] {}", message);
        return buildResponse(HttpStatus.BAD_REQUEST, message, "VALIDATION_FAILED");
    }

    // ── System Exceptions (5xx) → log ERROR kèm stacktrace ──

    @ExceptionHandler(EncryptionConfigException.class)
    public ResponseEntity<Map<String, Object>> handleEncryptionConfig(EncryptionConfigException ex) {
        log.error("[System] Encryption config error: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "ENCRYPTION_CONFIG_ERROR");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleServiceUnavailable(IllegalStateException ex) {
        log.error("[System] Service error: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, "Service temporarily unavailable", "SERVICE_UNAVAILABLE");
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("[System] Unexpected error: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "INTERNAL_ERROR");
    }

    // ── Helpers ──

    private HttpStatus resolveStatus(BaseBusinessException ex) {
        if (ex instanceof ResourceNotFoundException) return HttpStatus.NOT_FOUND;
        if (ex instanceof ResourceConflictException) return HttpStatus.CONFLICT;
        if (ex instanceof BusinessStateException) return HttpStatus.UNPROCESSABLE_ENTITY;
        if (ex instanceof InvalidInputException) return HttpStatus.BAD_REQUEST;
        return HttpStatus.BAD_REQUEST;
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message, String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("code", code);
        body.put("traceId", MDC.get("traceId"));
        return ResponseEntity.status(status).body(body);
    }
}
