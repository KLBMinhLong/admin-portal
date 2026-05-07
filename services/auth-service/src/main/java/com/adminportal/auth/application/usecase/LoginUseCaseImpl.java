package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.in.LoginUseCase;
import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.AuthenticatedSessionService;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Flow theo ghi chu lead:
 * FE -> BE (username+password) -> Keycloak verify via custom user provider -> OK
 * BE mint token {username, role} -> save DB + Redis -> return FE
 * Login moi -> revoke token cu (single session)
 */
@Service
public class LoginUseCaseImpl implements LoginUseCase {
    private static final Logger log = LoggerFactory.getLogger(LoginUseCaseImpl.class);

    private final KeycloakPort       keycloakPort;
    private final UserRepositoryPort userRepository;
    private final ChallengeStorePort challengeStore;
    private final AuthenticatedSessionService authenticatedSessionService;

    public LoginUseCaseImpl(KeycloakPort keycloakPort,
                            UserRepositoryPort userRepository,
                            ChallengeStorePort challengeStore,
                            AuthenticatedSessionService authenticatedSessionService) {
        this.keycloakPort = keycloakPort;
        this.userRepository = userRepository;
        this.challengeStore = challengeStore;
        this.authenticatedSessionService = authenticatedSessionService;
    }

    @Override
    @Transactional
    public LoginResponse execute(LoginRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();
        log.debug("Login attempt for username={}", normalizedUsername);

        // Step 1: Keycloak verifies credentials through the primary DB user provider.
        keycloakPort.authenticate(normalizedUsername, request.password());

        // Step 2: Lock user row trong transaction de tranh 2 login song song tao 2 token active
        User user = userRepository.findByUsernameForUpdate(normalizedUsername)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + normalizedUsername));
        if (!user.isActive()) {
            throw new BusinessStateException("USER_INACTIVE", "User inactive: " + normalizedUsername);
        }

        // Step 3: Check 2FA
        if (user.isTwoFactorEnabled()) {
            String challenge = challengeStore.create(user.getId(), request.deviceInfo());
            log.info("2FA challenge issued for userId={}", user.getId());
            return LoginResponse.requiresTwoFactor(challenge);
        }

        return authenticatedSessionService.create(user, request.deviceInfo());
    }
}
