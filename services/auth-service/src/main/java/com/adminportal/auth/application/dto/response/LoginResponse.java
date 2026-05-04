package com.adminportal.auth.application.dto.response;

public record LoginResponse(
    String token,
    UserProfile user,
    boolean requiresTwoFactor,
    String challenge
) {
    public static LoginResponse success(String token, String userId, String username, String role, java.util.List<String> authorities) {
        return new LoginResponse(token, new UserProfile(userId, username, role, authorities), false, null);
    }

    public static LoginResponse requiresTwoFactor(String challenge) {
        return new LoginResponse(null, null, true, challenge);
    }

    public record UserProfile(
        String id,
        String username,
        String role,
        java.util.List<String> authorities
    ) {
    }
}
