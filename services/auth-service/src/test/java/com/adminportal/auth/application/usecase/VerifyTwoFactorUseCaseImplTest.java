package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.TwoFactorVerifyRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.port.out.TwoFactorChallenge;
import com.adminportal.auth.application.port.out.TwoFactorVerifierPort;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VerifyTwoFactorUseCaseImplTest {

    @Mock
    private ChallengeStorePort challengeStore;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TwoFactorVerifierPort twoFactorVerifier;

    @Mock
    private TokenRepositoryPort tokenRepository;

    @Mock
    private TokenCachePort tokenCache;

    @Mock
    private TokenGeneratorPort tokenGenerator;

    @Mock
    private com.adminportal.auth.application.services.RuntimePermissionService runtimePermissionService;

    private VerifyTwoFactorUseCaseImpl verifyTwoFactorUseCase;

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
        verifyTwoFactorUseCase = new VerifyTwoFactorUseCaseImpl(
            challengeStore,
            userRepository,
            twoFactorVerifier,
            authenticatedSessionService
        );
    }

    @Test
    void shouldThrowWhenChallengeExpired() {
        when(challengeStore.find("2fa_challenge_expired")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> verifyTwoFactorUseCase.execute(new TwoFactorVerifyRequest("2fa_challenge_expired", "123456"))
        );

        assertEquals("2FA challenge expired", exception.getMessage());
    }

    @Test
    void shouldThrowWhenOtpIsInvalid() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        user.enableTwoFactor("secret");
        TwoFactorChallenge challenge = new TwoFactorChallenge(user.getId(), "Chrome");

        when(challengeStore.find("2fa_challenge_invalid")).thenReturn(Optional.of(challenge));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(twoFactorVerifier.verifyOtp("secret", "123456")).thenReturn(false);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> verifyTwoFactorUseCase.execute(new TwoFactorVerifyRequest("2fa_challenge_invalid", "123456"))
        );

        assertEquals("Invalid 2FA OTP", exception.getMessage());
        verify(challengeStore, times(0)).delete("2fa_challenge_invalid");
    }

    @Test
    void shouldCreateSessionAndDeleteChallengeWhenOtpIsValid() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        user.enableTwoFactor("secret");
        TwoFactorChallenge challenge = new TwoFactorChallenge(user.getId(), "Chrome");
        GeneratedToken generatedToken = new GeneratedToken("jwt-value", "new-jti", Instant.now());

        when(challengeStore.find("2fa_challenge_success")).thenReturn(Optional.of(challenge));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(twoFactorVerifier.verifyOtp("secret", "123456")).thenReturn(true);
        when(tokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of());
        when(tokenGenerator.generate(user)).thenReturn(generatedToken);
        when(tokenRepository.save(any(Token.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoginResponse response = verifyTwoFactorUseCase.execute(
            new TwoFactorVerifyRequest("2fa_challenge_success", "123456")
        );

        assertEquals("jwt-value", response.token());
        verify(challengeStore).delete("2fa_challenge_success");
        verify(tokenRepository).save(any(Token.class));
    }
}
