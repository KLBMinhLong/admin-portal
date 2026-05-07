package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.ResetPasswordRequest;
import com.adminportal.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.PasswordPolicy;
import com.adminportal.auth.application.service.UserSessionRevocationService;
import com.adminportal.auth.application.service.UsernamePasswordHashService;
import com.adminportal.auth.domain.entity.PasswordResetToken;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.BusinessStateException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResetPasswordUseCaseImplTest {

    @Mock
    private PasswordResetTokenRepositoryPort passwordResetTokenRepository;
    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private UsernamePasswordHashService hashService;
    @Mock
    private UserSessionRevocationService userSessionRevocationService;
    @Mock
    private PasswordPolicy passwordPolicy;

    private ResetPasswordUseCaseImpl resetPasswordUseCase;

    @BeforeEach
    void setUp() {
        resetPasswordUseCase = new ResetPasswordUseCaseImpl(
            passwordResetTokenRepository,
            userRepository,
            hashService,
            userSessionRevocationService,
            passwordPolicy
        );
    }

    @Test
    void shouldThrowWhenResetTokenExpired() {
        PasswordResetToken expiredToken = PasswordResetToken.issue(UUID.randomUUID(), sha256("expired-token"), Instant.now().minusSeconds(30));
        when(passwordResetTokenRepository.findByTokenHash(sha256("expired-token"))).thenReturn(Optional.of(expiredToken));

        BusinessStateException exception = assertThrows(
            BusinessStateException.class,
            () -> resetPasswordUseCase.execute(new ResetPasswordRequest("expired-token", "SecurePass@1234"))
        );

        assertEquals("Invalid reset token", exception.getMessage());
    }

    @Test
    void shouldResetPasswordAndRevokeActiveSessions() {
        User user = User.create("john.doe", "john@example.com", "$2-old-hash", "ROLE_USER", "John", "Doe");
        PasswordResetToken resetToken = PasswordResetToken.issue(user.getId(), sha256("valid-token"), Instant.now().plusSeconds(1800));

        when(passwordResetTokenRepository.findByTokenHash(sha256("valid-token"))).thenReturn(Optional.of(resetToken));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(hashService.encode("john.doe", "SecurePass@1234")).thenReturn("new-hash");
        when(passwordResetTokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of(resetToken));

        resetPasswordUseCase.execute(new ResetPasswordRequest("valid-token", "SecurePass@1234"));

        assertEquals("new-hash", user.getPasswordHash());
        assertTrue(resetToken.isUsed());
        verify(userSessionRevocationService).revokeAll(user.getId());
        verify(userRepository).save(user);
        verify(passwordPolicy).validate("SecurePass@1234");
    }

    private String sha256(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(messageDigest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
