package com.adminportal.auth.application.services;

import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;

@Service
public class AuthenticatedSessionService {
    private static final Logger log = LoggerFactory.getLogger(AuthenticatedSessionService.class);

    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort tokenCache;
    private final TokenGeneratorPort tokenGenerator;

    public AuthenticatedSessionService(TokenRepositoryPort tokenRepository,
                                       TokenCachePort tokenCache,
                                       TokenGeneratorPort tokenGenerator) {
        this.tokenRepository = tokenRepository;
        this.tokenCache = tokenCache;
        this.tokenGenerator = tokenGenerator;
    }

    public LoginResponse create(User user, String deviceInfo) {
        List<Token> activeTokens = tokenRepository.findActiveByUserId(user.getId());
        if (!activeTokens.isEmpty()) {
            log.info("Revoking {} old token(s) for userId={}", activeTokens.size(), user.getId());
            activeTokens.forEach(token -> {
                token.revoke();
                tokenCache.evict(token.getTokenJti());
            });
            tokenRepository.saveAll(activeTokens);
        }

        GeneratedToken generatedToken = tokenGenerator.generate(user);
        Token newToken = Token.issue(
            user.getId(),
            generatedToken.jti(),
            sha256(generatedToken.value()),
            generatedToken.issuedAt(),
            null,
            deviceInfo
        );

        tokenRepository.save(newToken);
        tokenCache.put(newToken);
        log.info("Token created for userId={}", user.getId());

        return LoginResponse.success(
            generatedToken.value(),
            user.getId().toString(),
            user.getUsername(),
            user.getRole()
        );
    }

    private String sha256(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] hash = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", exception);
        }
    }
}
