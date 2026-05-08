package com.adminportal.domain.infrastructure.web;

import org.slf4j.MDC;

import java.time.Instant;

public class ApiResponse<T> {

    private Instant timestamp;
    private int status;
    private String error;
    private String message;
    private String code;
    private String traceId;
    private T data;

    private ApiResponse() {
        this.timestamp = Instant.now();
        this.traceId = MDC.get("traceId");
    }

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.status = 200;
        r.error = "OK";
        r.message = "success";
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> success(T data, int status) {
        ApiResponse<T> r = new ApiResponse<>();
        r.status = status;
        r.error = status == 201 ? "Created" : "OK";
        r.message = "success";
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> error(int status, String message) {
        ApiResponse<T> r = new ApiResponse<>();
        r.status = status;
        r.error = (status >= 500) ? "Internal Server Error" : "Error";
        r.message = message;
        r.data = null;
        return r;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public String getCode() {
        return code;
    }

    public String getTraceId() {
        return traceId;
    }

    public T getData() {
        return data;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }
}
