package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.services.AuthenticatedSessionService;
import com.adminportal.auth.application.services.UserSessionRevocationService;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginUseCaseImplTest {

    @Mock
    private KeycloakPort keycloakPort;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private ChallengeStorePort challengeStore;

    @Mock
    private TokenRepositoryPort tokenRepository;

    @Mock
    private TokenCachePort tokenCache;

    @Mock
    private TokenGeneratorPort tokenGenerator;

    @Mock
    private com.adminportal.auth.application.services.RuntimePermissionService runtimePermissionService;

    private LoginUseCaseImpl loginUseCase;

    @BeforeEach
    void setUp() {
        UserSessionRevocationService userSessionRevocationService = new UserSessionRevocationService(
            tokenRepository,
            tokenCache
        );
        AuthenticatedSessionService authenticatedSessionService = new AuthenticatedSessionService(
            userSessionRevocationService,
            tokenGenerator,
            runtimePermissionService
        );
        loginUseCase = new LoginUseCaseImpl(
            keycloakPort,
            userRepository,
            challengeStore,
            authenticatedSessionService
        );
    }

    @Test
    void shouldCreateSessionImmediatelyWhenUserDoesNotUseTwoFactor() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        GeneratedToken generatedToken = new GeneratedToken("jwt-value", "new-jti", Instant.now());

        doNothing().when(keycloakPort).authenticate("john.doe", "SecurePass@123");
        when(userRepository.findByUsernameForUpdate("john.doe")).thenReturn(Optional.of(user));
        when(tokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of());
        when(tokenGenerator.generate(user)).thenReturn(generatedToken);
        when(tokenRepository.save(any(Token.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoginResponse response = loginUseCase.execute(new LoginRequest(
            "john.doe",
            "SecurePass@123",
            null,
            "Chrome"
        ));

        assertEquals("jwt-value", response.token());
        assertEquals(user.getId().toString(), response.user().id());
        assertEquals("john.doe", response.user().username());
        assertEquals("ROLE_USER", response.user().role());
        verify(tokenRepository).save(any(Token.class));
        verify(tokenCache).put(any(Token.class));
    }

    @Test
    void shouldReturnTwoFactorChallengeWhenUserHasTwoFactorEnabled() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        user.enableTwoFactor("secret");

        doNothing().when(keycloakPort).authenticate("john.doe", "SecurePass@123");
        when(userRepository.findByUsernameForUpdate("john.doe")).thenReturn(Optional.of(user));
        when(challengeStore.create(user.getId(), "Chrome")).thenReturn("2fa_challenge_123");

        LoginResponse response = loginUseCase.execute(new LoginRequest(
            "john.doe",
            "SecurePass@123",
            null,
            "Chrome"
        ));

        assertTrue(response.requiresTwoFactor());
        assertEquals("2fa_challenge_123", response.challenge());
    }
}
