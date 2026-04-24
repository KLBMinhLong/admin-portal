package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.in.LoginUseCase;
import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;

/**
 * Flow theo ghi chu lead:
 * FE -> BE (username+password) -> Keycloak verify -> OK
 * BE mint token {username, role} -> save DB + Redis -> return FE
 * Login moi -> revoke token cu (single session)
 */
@Service
public class LoginUseCaseImpl implements LoginUseCase {
    private static final Logger log = LoggerFactory.getLogger(LoginUseCaseImpl.class);

    private final KeycloakPort       keycloakPort;
    private final UserRepositoryPort userRepository;
    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort     tokenCache;
    private final TokenGeneratorPort tokenGenerator;

    public LoginUseCaseImpl(KeycloakPort keycloakPort,
                            UserRepositoryPort userRepository,
                            TokenRepositoryPort tokenRepository,
                            TokenCachePort tokenCache,
                            TokenGeneratorPort tokenGenerator) {
        this.keycloakPort = keycloakPort;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.tokenCache = tokenCache;
        this.tokenGenerator = tokenGenerator;
    }

    @Override
    @Transactional
    public LoginResponse execute(LoginRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();
        log.debug("Login attempt for username={}", normalizedUsername);

        // Step 1: Keycloak custom provider verify credentials
        keycloakPort.authenticate(normalizedUsername, request.password());

        // Step 2: Lock user row trong transaction de tranh 2 login song song tao 2 token active
        User user = userRepository.findByUsernameForUpdate(normalizedUsername)
            .orElseThrow(() -> new RuntimeException("User not found: " + normalizedUsername));
        if (!user.isActive()) {
            throw new RuntimeException("User inactive: " + normalizedUsername);
        }

        // Step 3: Check 2FA
        if (user.isTwoFactorEnabled()) {
            if (request.totpCode() == null || request.totpCode().isBlank()) {
                log.debug("2FA required for username={}", request.username());
                return LoginResponse.requiresTwoFactor("2fa_" + user.getId());
            }
        }

        // Step 4: Revoke token cu (1 phien dang nhap duy nhat)
        List<Token> activeTokens = tokenRepository.findActiveByUserId(user.getId());
        if (!activeTokens.isEmpty()) {
            log.info("Revoking {} old token(s) for userId={}", activeTokens.size(), user.getId());
            activeTokens.forEach(token -> {
                token.revoke();
                tokenCache.evict(token.getTokenJti());
            });
            tokenRepository.saveAll(activeTokens);
        }

        // Step 5: Tao token moi - chi chua username + role (khong co permission)
        GeneratedToken generatedToken = tokenGenerator.generate(user);

        Token newToken = Token.issue(
            user.getId(),
            generatedToken.jti(),
            sha256(generatedToken.value()),
            generatedToken.issuedAt(),
            null,
            request.deviceInfo()
        );

        // Step 6: Luu DB + dong bo Redis cache
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
