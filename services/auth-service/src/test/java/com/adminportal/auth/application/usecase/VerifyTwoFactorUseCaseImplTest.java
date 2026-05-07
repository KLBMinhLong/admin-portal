package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.TwoFactorVerifyRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.TwoFactorChallenge;
import com.adminportal.auth.application.port.out.TwoFactorVerifierPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.AuthenticatedSessionService;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.InvalidInputException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerifyTwoFactorUseCaseImplTest {

    @Mock
    private ChallengeStorePort challengeStore;
    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private TwoFactorVerifierPort twoFactorVerifier;
    @Mock
    private AuthenticatedSessionService authenticatedSessionService;

    private VerifyTwoFactorUseCaseImpl verifyTwoFactorUseCase;

    @BeforeEach
    void setUp() {
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

        BusinessStateException exception = assertThrows(
            BusinessStateException.class,
            () -> verifyTwoFactorUseCase.execute(new TwoFactorVerifyRequest("2fa_challenge_expired", "123456"))
        );

        assertEquals("2FA challenge expired", exception.getMessage());
    }

    @Test
    void shouldThrowWhenOtpIsInvalid() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");
        user.enableTwoFactor("secret");
        TwoFactorChallenge challenge = new TwoFactorChallenge(user.getId(), "Chrome");

        when(challengeStore.find("2fa_challenge_invalid")).thenReturn(Optional.of(challenge));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(twoFactorVerifier.verifyOtp("secret", "123456")).thenReturn(false);

        InvalidInputException exception = assertThrows(
            InvalidInputException.class,
            () -> verifyTwoFactorUseCase.execute(new TwoFactorVerifyRequest("2fa_challenge_invalid", "123456"))
        );

        assertEquals("Invalid 2FA OTP", exception.getMessage());
        verify(challengeStore, times(0)).delete("2fa_challenge_invalid");
    }

    @Test
    void shouldCreateSessionAndDeleteChallengeWhenOtpIsValid() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");
        user.enableTwoFactor("secret");
        TwoFactorChallenge challenge = new TwoFactorChallenge(user.getId(), "Chrome");
        LoginResponse loginResponse = LoginResponse.success("jwt-value", "user-id", "username", "role", java.util.List.of());

        when(challengeStore.find("2fa_challenge_success")).thenReturn(Optional.of(challenge));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(twoFactorVerifier.verifyOtp("secret", "123456")).thenReturn(true);
        when(authenticatedSessionService.create(user, "Chrome")).thenReturn(loginResponse);

        LoginResponse response = verifyTwoFactorUseCase.execute(
            new TwoFactorVerifyRequest("2fa_challenge_success", "123456")
        );

        assertEquals("jwt-value", response.token());
        verify(challengeStore).delete("2fa_challenge_success");
        verify(authenticatedSessionService).create(user, "Chrome");
    }
}
