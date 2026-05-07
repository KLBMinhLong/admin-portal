package com.adminportal.gateway.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class DefaultJwtProvider implements JwtProvider {

    private final SecretKey secretKey;

    public DefaultJwtProvider(@Value("${app.token.secret}") String tokenSecret) {
        this.secretKey = Keys.hmacShaKeyFor(tokenSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public JwtPrincipal parse(String token) {
        try {
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
        } catch (Exception e) {
            log.error("[JWT] Failed to parse token: {}", e.getMessage());
            throw new RuntimeException("Invalid token", e);
        }
    }
}
