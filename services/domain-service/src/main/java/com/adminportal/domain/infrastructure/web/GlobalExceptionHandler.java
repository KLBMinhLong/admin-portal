package com.adminportal.domain.infrastructure.web;

import com.adminportal.domain.domain.exception.BusinessStateException;
import com.adminportal.domain.domain.exception.DomainConflictException;
import com.adminportal.domain.domain.exception.ResourceNotFoundException;
import com.adminportal.domain.infrastructure.encryption.DecryptionFailedException;
import com.adminportal.domain.infrastructure.encryption.EncryptionConfigException;
import com.adminportal.domain.infrastructure.encryption.InvalidEncryptedPayloadException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Global exception handler – trả JSON lỗi chuẩn cho mọi exception.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining("; "));
        return buildResponse(HttpStatus.BAD_REQUEST, errors);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingHeader(MissingRequestHeaderException ex) {
        // UC-SEC-02 A1: Thiếu Idempotency-Key → error code rõ ràng
        if (ex.getHeaderName().equalsIgnoreCase("Idempotency-Key")) {
            return buildResponse(HttpStatus.BAD_REQUEST, "MISSING_IDEMPOTENCY_KEY");
        }
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(com.adminportal.domain.domain.exception.IdempotencyInProgressException.class)
    public ResponseEntity<ApiResponse<Object>> handleIdempotencyInProgress(
            com.adminportal.domain.domain.exception.IdempotencyInProgressException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(com.adminportal.domain.domain.exception.IdempotencyPayloadMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleIdempotencyPayloadMismatch(
            com.adminportal.domain.domain.exception.IdempotencyPayloadMismatchException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArg(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidEncryptedPayloadException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidEncryptedPayload(InvalidEncryptedPayloadException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(DecryptionFailedException.class)
    public ResponseEntity<ApiResponse<Object>> handleDecryptionFailed(DecryptionFailedException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(EncryptionConfigException.class)
    public ResponseEntity<ApiResponse<Object>> handleEncryptionConfig(EncryptionConfigException ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Business not found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BusinessStateException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusinessState(BusinessStateException ex) {
        log.warn("Business state violation: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(DomainConflictException.class)
    public ResponseEntity<ApiResponse<Object>> handleConflict(DomainConflictException ex) {
        log.warn("Business conflict: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    private ResponseEntity<ApiResponse<Object>> buildResponse(HttpStatus status, String message) {
        ApiResponse<Object> body = ApiResponse.error(status.value(), message);
        return ResponseEntity.status(status).body(body);
    }
}
