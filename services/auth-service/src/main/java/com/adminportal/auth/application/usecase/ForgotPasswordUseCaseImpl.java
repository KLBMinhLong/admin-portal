package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.ForgotPasswordRequest;
import com.adminportal.auth.application.port.in.ForgotPasswordUseCase;
import com.adminportal.auth.application.port.out.PasswordResetNotifierPort;
import com.adminportal.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.PasswordResetToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ForgotPasswordUseCaseImpl implements ForgotPasswordUseCase {
    private static final Logger log = LoggerFactory.getLogger(ForgotPasswordUseCaseImpl.class);
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(30);

    private final UserRepositoryPort userRepository;
    private final PasswordResetTokenRepositoryPort passwordResetTokenRepository;
    private final PasswordResetNotifierPort passwordResetNotifier;

    public ForgotPasswordUseCaseImpl(UserRepositoryPort userRepository,
                                     PasswordResetTokenRepositoryPort passwordResetTokenRepository,
                                     PasswordResetNotifierPort passwordResetNotifier) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetNotifier = passwordResetNotifier;
    }

    @Override
    @Transactional
    public void execute(ForgotPasswordRequest request) {
        String normalizedEmail = normalize(request.email());
        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(user -> {
            invalidateExistingResetTokens(user.getId());

            String rawToken = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.issue(
                user.getId(),
                sha256(rawToken),
                Instant.now().plus(RESET_TOKEN_TTL)
            );
            passwordResetTokenRepository.save(resetToken);
            passwordResetNotifier.sendResetLink(user, rawToken);
            log.info("Password reset token issued for userId={}", user.getId());
        }, () -> log.info("Password reset requested for non-existing email={}", normalizedEmail));
    }

    private void invalidateExistingResetTokens(UUID userId) {
        List<PasswordResetToken> existingTokens = passwordResetTokenRepository.findActiveByUserId(userId);
        if (existingTokens.isEmpty()) {
            return;
        }

        existingTokens.forEach(PasswordResetToken::markUsed);
        passwordResetTokenRepository.saveAll(existingTokens);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String sha256(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] hash = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", exception);
        }
    }
}
