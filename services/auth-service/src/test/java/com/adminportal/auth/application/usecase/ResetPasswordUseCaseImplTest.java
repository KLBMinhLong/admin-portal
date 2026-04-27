package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.ResetPasswordRequest;
import com.adminportal.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.services.UserSessionRevocationService;
import com.adminportal.auth.domain.entity.PasswordResetToken;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResetPasswordUseCaseImplTest {

    @Mock
    private PasswordResetTokenRepositoryPort passwordResetTokenRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TokenRepositoryPort tokenRepository;

    @Mock
    private TokenCachePort tokenCache;

    private ResetPasswordUseCaseImpl resetPasswordUseCase;

    @BeforeEach
    void setUp() {
        UserSessionRevocationService userSessionRevocationService = new UserSessionRevocationService(tokenRepository, tokenCache);
        resetPasswordUseCase = new ResetPasswordUseCaseImpl(
            passwordResetTokenRepository,
            userRepository,
            new BCryptPasswordEncoder(12),
            userSessionRevocationService
        );
    }

    @Test
    void shouldThrowWhenResetTokenExpired() {
        PasswordResetToken expiredToken = PasswordResetToken.issue(java.util.UUID.randomUUID(), sha256("expired-token"), Instant.now().minusSeconds(30));
        when(passwordResetTokenRepository.findByTokenHash(sha256("expired-token"))).thenReturn(Optional.of(expiredToken));

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> resetPasswordUseCase.execute(new ResetPasswordRequest("expired-token", "SecurePass@1234"))
        );

        assertEquals("Invalid reset token", exception.getMessage());
    }

    @Test
    void shouldThrowWhenResetTokenAlreadyUsed() {
        PasswordResetToken usedToken = PasswordResetToken.issue(java.util.UUID.randomUUID(), sha256("used-token"), Instant.now().plusSeconds(60));
        usedToken.markUsed();
        when(passwordResetTokenRepository.findByTokenHash(sha256("used-token"))).thenReturn(Optional.of(usedToken));

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> resetPasswordUseCase.execute(new ResetPasswordRequest("used-token", "SecurePass@1234"))
        );

        assertEquals("Invalid reset token", exception.getMessage());
    }

    @Test
    void shouldResetPasswordAndRevokeActiveSessions() {
        User user = User.create("john.doe", "john@example.com", "$2-old-hash", "ROLE_USER");
        PasswordResetToken resetToken = PasswordResetToken.issue(user.getId(), sha256("valid-token"), Instant.now().plusSeconds(1800));
        Token activeToken = Token.issue(user.getId(), "jti-1", "hash-1", Instant.now(), null, "Chrome");

        when(passwordResetTokenRepository.findByTokenHash(sha256("valid-token"))).thenReturn(Optional.of(resetToken));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(tokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of(activeToken));
        when(tokenRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetTokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of(resetToken));
        when(passwordResetTokenRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        resetPasswordUseCase.execute(new ResetPasswordRequest("valid-token", "SecurePass@1234"));

        assertTrue(user.getPasswordHash().startsWith("$2"));
        assertTrue(resetToken.isUsed());
        verify(tokenCache).evict("jti-1");
        verify(userRepository).save(user);
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
