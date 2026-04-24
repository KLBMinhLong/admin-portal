package com.adminportal.auth.infrastructure.security;

import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtProvider implements TokenGeneratorPort {

    private final SecretKey secretKey;

    public JwtProvider(@Value("${app.token.secret}") String tokenSecret) {
        this.secretKey = Keys.hmacShaKeyFor(tokenSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public GeneratedToken generate(User user) {
        Instant issuedAt = Instant.now();
        String jti = UUID.randomUUID().toString();
        String token = Jwts.builder()
            .subject(user.getUsername())
            .claim("username", user.getUsername())
            .claim("role", user.getRole())
            .claim("userId", user.getId().toString())
            .id(jti)
            .issuedAt(Date.from(issuedAt))
            .signWith(secretKey)
            .compact();
        return new GeneratedToken(token, jti, issuedAt);
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
