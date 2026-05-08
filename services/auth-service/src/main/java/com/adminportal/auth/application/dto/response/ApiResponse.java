package com.adminportal.auth.application.dto.response;

import lombok.Getter;
import org.slf4j.MDC;

import java.time.Instant;

/**
 * Standard API Response wrapper for success cases.
 * Following "Premium Design" principles for consistent API contracts.
 */
@Getter
public class ApiResponse<T> {
    private final String timestamp;
    private final int status;
    private final T data;
    private final String message;
    private final String error;
    private final String code;
    private final String traceId;

    private ApiResponse(int status, T data, String message, String error, String code, String traceId) {
        this.timestamp = Instant.now().toString();
        this.status = status;
        this.data = data;
        this.message = message;
        this.error = error;
        this.code = code;
        this.traceId = traceId;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, data, "Success", null, "SUCCESS", currentTraceId());
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(200, data, message, null, "SUCCESS", currentTraceId());
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, data, "Created successfully", null, "CREATED", currentTraceId());
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(200, null, message, null, "SUCCESS", currentTraceId());
    }

    private static String currentTraceId() {
        return MDC.get("traceId");
    }
}
