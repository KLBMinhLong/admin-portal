package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.RegisterRequest;
import com.adminportal.auth.application.dto.response.RegisterResponse;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegisterUseCaseImplTest {

    @Mock
    private UserRepositoryPort userRepository;

    private RegisterUseCaseImpl registerUseCase;

    @BeforeEach
    void setUp() {
        registerUseCase = new RegisterUseCaseImpl(userRepository, new BCryptPasswordEncoder(12));
    }

    @Test
    void shouldRegisterSuccessfullyWithNormalizedFields() {
        RegisterRequest request = new RegisterRequest(
            "John_Doe",
            "John@Example.com",
            "SecurePass@1234",
            "John",
            "Doe"
        );

        when(userRepository.existsByUsername("john_doe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterResponse response = registerUseCase.execute(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertEquals("john_doe", savedUser.getUsername());
        assertEquals("john@example.com", savedUser.getEmail());
        assertEquals("john_doe", response.username());
        assertEquals("john@example.com", response.email());
        assertFalse(response.emailVerified());
        assertTrue(savedUser.getPasswordHash().startsWith("$2"));
    }

    @Test
    void shouldThrowWhenPasswordViolatesPolicy() {
        RegisterRequest request = new RegisterRequest(
            "john_doe",
            "john@example.com",
            "weakpassword",
            "John",
            "Doe"
        );

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> registerUseCase.execute(request)
        );
        assertEquals("Password must contain an uppercase letter", exception.getMessage());
    }

    @Test
    void shouldThrowWhenUsernameExists() {
        RegisterRequest request = new RegisterRequest(
            "john_doe",
            "john@example.com",
            "SecurePass@1234",
            "John",
            "Doe"
        );

        when(userRepository.existsByUsername("john_doe")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> registerUseCase.execute(request)
        );
        assertEquals("Username already exists", exception.getMessage());
    }
}
