package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.ResetPasswordRequest;
import com.adminportal.auth.application.port.in.ResetPasswordUseCase;
import com.adminportal.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.services.UserSessionRevocationService;
import com.adminportal.auth.domain.entity.PasswordResetToken;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ResetPasswordUseCaseImpl implements ResetPasswordUseCase {
    private static final Logger log = LoggerFactory.getLogger(ResetPasswordUseCaseImpl.class);

    private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern HAS_LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern HAS_NUMBER = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_SPECIAL = Pattern.compile(".*[^a-zA-Z0-9].*");

    private final PasswordResetTokenRepositoryPort passwordResetTokenRepository;
    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionRevocationService userSessionRevocationService;

    public ResetPasswordUseCaseImpl(PasswordResetTokenRepositoryPort passwordResetTokenRepository,
                                    UserRepositoryPort userRepository,
                                    PasswordEncoder passwordEncoder,
                                    UserSessionRevocationService userSessionRevocationService) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSessionRevocationService = userSessionRevocationService;
    }

    @Override
    @Transactional
    public void execute(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(sha256(request.token()))
            .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

        if (resetToken.isExpired() || resetToken.isUsed()) {
            throw new IllegalArgumentException("Invalid reset token");
        }

        validatePasswordPolicy(request.newPassword());

        User user = userRepository.findById(resetToken.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

        user.changePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        userSessionRevocationService.revokeAll(user.getId());

        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findActiveByUserId(user.getId());
        activeTokens.forEach(PasswordResetToken::markUsed);
        passwordResetTokenRepository.saveAll(activeTokens);

        log.info("Password reset completed for userId={}", user.getId());
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 12) {
            throw new IllegalArgumentException("Password must be at least 12 characters");
        }
        if (!HAS_UPPERCASE.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain an uppercase letter");
        }
        if (!HAS_LOWERCASE.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain a lowercase letter");
        }
        if (!HAS_NUMBER.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain a number");
        }
        if (!HAS_SPECIAL.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain a special character");
        }
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
