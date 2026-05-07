package com.adminportal.auth.application.dto.response;

import lombok.Getter;

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

    private ApiResponse(int status, T data, String message) {
        this.timestamp = Instant.now().toString();
        this.status = status;
        this.data = data;
        this.message = message;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, data, "Success");
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(200, data, message);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, data, "Created successfully");
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(200, null, message);
    }
}
