package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginUseCaseImplTest {

    @Mock
    private KeycloakPort keycloakPort;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TokenRepositoryPort tokenRepository;

    @Mock
    private TokenCachePort tokenCache;

    @Mock
    private TokenGeneratorPort tokenGenerator;

    private LoginUseCaseImpl loginUseCase;

    @BeforeEach
    void setUp() {
        loginUseCase = new LoginUseCaseImpl(
            keycloakPort,
            userRepository,
            tokenRepository,
            tokenCache,
            tokenGenerator
        );
    }

    @Test
    void shouldRevokeAllActiveTokensAndIssueSingleSessionToken() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        Token oldTokenOne = Token.issue(user.getId(), "old-jti-1", "old-hash-1", Instant.now(), null, "Chrome");
        Token oldTokenTwo = Token.issue(user.getId(), "old-jti-2", "old-hash-2", Instant.now(), null, "Safari");
        GeneratedToken generatedToken = new GeneratedToken("jwt-value", "new-jti", Instant.now());

        doNothing().when(keycloakPort).authenticate("john.doe", "SecurePass@123");
        when(userRepository.findByUsernameForUpdate("john.doe")).thenReturn(Optional.of(user));
        when(tokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of(oldTokenOne, oldTokenTwo));
        when(tokenRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenRepository.save(any(Token.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenGenerator.generate(user)).thenReturn(generatedToken);

        LoginResponse response = loginUseCase.execute(new LoginRequest(
            "john.doe",
            "SecurePass@123",
            null,
            "Chrome"
        ));

        ArgumentCaptor<Token> newTokenCaptor = ArgumentCaptor.forClass(Token.class);
        verify(tokenRepository).save(newTokenCaptor.capture());
        verify(tokenRepository).saveAll(any());
        verify(tokenCache).evict("old-jti-1");
        verify(tokenCache).evict("old-jti-2");
        verify(tokenCache).put(any(Token.class));

        Token newToken = newTokenCaptor.getValue();
        assertEquals("jwt-value", response.token());
        assertNotNull(response.user());
        assertEquals(user.getId().toString(), response.user().id());
        assertEquals("john.doe", response.user().username());
        assertEquals("ROLE_USER", response.user().role());
        assertEquals("new-jti", newToken.getTokenJti());
        assertTrue(newToken.isActive());
        assertEquals(user.getId(), newToken.getUserId());
    }

    @Test
    void shouldReturnTwoFactorChallengeWhenUserHasTwoFactorEnabled() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        user.enableTwoFactor("secret");

        doNothing().when(keycloakPort).authenticate("john.doe", "SecurePass@123");
        when(userRepository.findByUsernameForUpdate("john.doe")).thenReturn(Optional.of(user));

        LoginResponse response = loginUseCase.execute(new LoginRequest(
            "john.doe",
            "SecurePass@123",
            null,
            "Chrome"
        ));

        assertTrue(response.requiresTwoFactor());
        assertTrue(response.challenge().startsWith("2fa_"));
        verify(tokenRepository, times(0)).save(any(Token.class));
    }
}
