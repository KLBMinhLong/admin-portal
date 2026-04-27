package com.adminportal.gateway.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtProvider {

    private final SecretKey secretKey;

    public JwtProvider(@Value("${app.token.secret}") String tokenSecret) {
        this.secretKey = Keys.hmacShaKeyFor(tokenSecret.getBytes(StandardCharsets.UTF_8));
    }

    public JwtPrincipal parse(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return new JwtPrincipal(
            claims.getSubject(),
            claims.get("username", String.class),
            claims.get("role", String.class),
            claims.get("userId", String.class),
            claims.getId()
        );
    }

    public record JwtPrincipal(
        String subject,
        String username,
        String role,
        String userId,
        String jti
    ) {
    }
}
