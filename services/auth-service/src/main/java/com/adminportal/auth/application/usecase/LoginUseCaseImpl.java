package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.in.LoginUseCase;
import com.adminportal.auth.application.port.out.*;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Flow theo ghi chu lead:
 * FE -> BE (username+password) -> Keycloak verify -> OK
 * BE mint token {username, role} -> save DB + Redis -> return FE
 * Login moi -> revoke token cu (single session)
 */
@Service
@RequiredArgsConstructor
public class LoginUseCaseImpl implements LoginUseCase {
    private static final Logger log = LoggerFactory.getLogger(LoginUseCaseImpl.class);

    private final KeycloakPort       keycloakPort;
    private final UserRepositoryPort userRepository;
    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort     tokenCache;
    private final TokenGeneratorPort tokenGenerator;

    @Override
    @Transactional
    public LoginResponse execute(LoginRequest request) {
        log.debug("Login attempt for username={}", request.username());

        // Step 1: Keycloak custom provider verify credentials
        keycloakPort.authenticate(request.username(), request.password());

        // Step 2: Load user tu OUR DB (khong phai Keycloak DB)
        User user = userRepository.findByUsername(request.username())
            .filter(User::isActive)
            .orElseThrow(() -> new RuntimeException("User not found: " + request.username()));

        // Step 3: Check 2FA
        if (user.isTwoFactorEnabled()) {
            if (request.totpCode() == null || request.totpCode().isBlank()) {
                log.debug("2FA required for username={}", request.username());
                return LoginResponse.requiresTwoFactor(user.getId().toString());
            }
        }

        // Step 4: Revoke token cu (1 phien dang nhap duy nhat)
        tokenRepository.findActiveByUserId(user.getId()).ifPresent(oldToken -> {
            log.info("Revoking old token for userId={}", user.getId());
            oldToken.revoke();
            tokenRepository.save(oldToken);
            tokenCache.evict(oldToken.getTokenValue());
        });

        // Step 5: Tao token moi - chi chua username + role (khong co permission)
        String jwt = tokenGenerator.generate(user.getUsername(), user.getRole());

        Token newToken = Token.create(
            user.getId(), user.getUsername(),
            user.getRole(), jwt, request.deviceInfo()
        );

        // Step 6: Luu DB + dong bo Redis cache
        tokenRepository.save(newToken);
        tokenCache.put(jwt, newToken);
        log.info("Token created for userId={}", user.getId());

        return LoginResponse.success(jwt, user.getUsername(), user.getRole());
    }
}
