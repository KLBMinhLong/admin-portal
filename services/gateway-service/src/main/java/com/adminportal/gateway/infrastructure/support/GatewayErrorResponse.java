package com.adminportal.gateway.infrastructure.support;

public record GatewayErrorResponse(
    String code,
    String message,
    String path,
    String traceId,
    String spanId,
    String timestamp
) {
}
