package com.adminportal.auth.application.dto.response;
public record LoginResponse(
    String token,
    String username,
    String role,
    boolean requiresTwoFactor,
    String userId
) {
    public static LoginResponse success(String token, String username, String role) {
        return new LoginResponse(token, username, role, false, null);
    }
    public static LoginResponse requiresTwoFactor(String userId) {
        return new LoginResponse(null, null, null, true, userId);
    }
}
