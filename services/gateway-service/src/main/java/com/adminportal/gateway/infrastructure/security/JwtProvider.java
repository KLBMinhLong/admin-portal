package com.adminportal.gateway.infrastructure.security;

public interface JwtProvider {
    JwtPrincipal parse(String token);

    record JwtPrincipal(
        String subject,
        String username,
        String role,
        String userId,
        String jti
    ) {
    }
}
