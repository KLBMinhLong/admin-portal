package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.RegisterRequest;
import com.adminportal.auth.application.dto.response.RegisterResponse;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.PasswordPolicy;
import com.adminportal.auth.application.service.UsernamePasswordHashService;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.ResourceConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegisterUseCaseImplTest {

    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private RoleRepositoryPort roleRepository;
    @Mock
    private UsernamePasswordHashService hashService;
    @Mock
    private PasswordPolicy passwordPolicy;

    private RegisterUseCaseImpl registerUseCase;
    private Role defaultRole;

    @BeforeEach
    void setUp() {
        registerUseCase = new RegisterUseCaseImpl(userRepository, roleRepository, hashService, passwordPolicy);
        defaultRole = Role.create("USER", "User", "Default role");
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
        when(roleRepository.findByCode("USER")).thenReturn(Optional.of(defaultRole));
        when(hashService.encode("john_doe", "SecurePass@1234")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterResponse response = registerUseCase.execute(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertEquals("john_doe", savedUser.getUsername());
        assertEquals("john@example.com", savedUser.getEmail());
        assertEquals("hashed-password", savedUser.getPasswordHash());
        assertEquals("john_doe", response.username());
        verify(passwordPolicy).validate("SecurePass@1234");
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

        assertThrows(ResourceConflictException.class, () -> registerUseCase.execute(request));
    }
}
