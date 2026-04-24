package com.adminportal.auth.application.dto.response;

public record RegisterResponse(
    String userId,
    String username,
    String email,
    boolean emailVerified,
    String message
) {
}
