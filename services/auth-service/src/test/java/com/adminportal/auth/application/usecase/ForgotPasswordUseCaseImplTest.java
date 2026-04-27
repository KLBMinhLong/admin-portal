package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.ForgotPasswordRequest;
import com.adminportal.auth.application.port.out.PasswordResetNotifierPort;
import com.adminportal.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.PasswordResetToken;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForgotPasswordUseCaseImplTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PasswordResetTokenRepositoryPort passwordResetTokenRepository;

    @Mock
    private PasswordResetNotifierPort passwordResetNotifier;

    private ForgotPasswordUseCaseImpl forgotPasswordUseCase;

    @BeforeEach
    void setUp() {
        forgotPasswordUseCase = new ForgotPasswordUseCaseImpl(
            userRepository,
            passwordResetTokenRepository,
            passwordResetNotifier
        );
    }

    @Test
    void shouldGenerateResetTokenAndNotifyWhenEmailExists() {
        User user = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");
        PasswordResetToken previousToken = PasswordResetToken.issue(user.getId(), "old-hash", Instant.now().plusSeconds(60));

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.findActiveByUserId(user.getId())).thenReturn(List.of(previousToken));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        forgotPasswordUseCase.execute(new ForgotPasswordRequest("John@Example.com"));

        verify(passwordResetTokenRepository).saveAll(any());
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(passwordResetNotifier).sendResetLink(any(User.class), any(String.class));
    }

    @Test
    void shouldReturnGenericSuccessWhenEmailDoesNotExist() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        forgotPasswordUseCase.execute(new ForgotPasswordRequest("unknown@example.com"));

        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
        verify(passwordResetNotifier, never()).sendResetLink(any(User.class), any(String.class));
    }
}
