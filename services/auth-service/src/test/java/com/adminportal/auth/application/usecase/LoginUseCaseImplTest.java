package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.AuthenticatedSessionService;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginUseCaseImplTest {

    @Mock
    private KeycloakPort keycloakPort;
    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private ChallengeStorePort challengeStore;
    @Mock
    private AuthenticatedSessionService authenticatedSessionService;

    private LoginUseCaseImpl loginUseCase;

    @BeforeEach
    void setUp() {
        loginUseCase = new LoginUseCaseImpl(
            keycloakPort,
            userRepository,
            challengeStore,
            authenticatedSessionService
        );
    }

    @Test
    void shouldCreateSessionImmediatelyWhenUserDoesNotUseTwoFactor() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");
        LoginResponse loginResponse = LoginResponse.success("jwt-value", "user-id", "username", "role", java.util.List.of());

        doNothing().when(keycloakPort).authenticate("john.doe", "SecurePass@123");
        when(userRepository.findByUsernameForUpdate("john.doe")).thenReturn(Optional.of(user));
        when(authenticatedSessionService.create(user, "Chrome")).thenReturn(loginResponse);

        LoginResponse response = loginUseCase.execute(new LoginRequest(
            "john.doe",
            "SecurePass@123",
            null,
            "Chrome"
        ));

        assertEquals("jwt-value", response.token());
        verify(authenticatedSessionService).create(user, "Chrome");
    }

    @Test
    void shouldReturnTwoFactorChallengeWhenUserHasTwoFactorEnabled() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");
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

    @Test
    void shouldThrowWhenUserNotFound() {
        doNothing().when(keycloakPort).authenticate("ghost", "pass");
        when(userRepository.findByUsernameForUpdate("ghost")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> loginUseCase.execute(new LoginRequest("ghost", "pass", null, "Chrome")));
    }

    @Test
    void shouldThrowWhenUserInactive() {
        User user = User.create("inactive", "a@b.com", "hash", "ROLE_USER", "A", "B");
        user.setActive(false);

        doNothing().when(keycloakPort).authenticate("inactive", "pass");
        when(userRepository.findByUsernameForUpdate("inactive")).thenReturn(Optional.of(user));

        assertThrows(BusinessStateException.class, () -> loginUseCase.execute(new LoginRequest("inactive", "pass", null, "Chrome")));
    }
}
