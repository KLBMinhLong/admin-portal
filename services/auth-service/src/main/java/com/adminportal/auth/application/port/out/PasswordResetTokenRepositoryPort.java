package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.PasswordResetToken;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepositoryPort {
    PasswordResetToken save(PasswordResetToken token);

    List<PasswordResetToken> saveAll(List<PasswordResetToken> tokens);

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findActiveByUserId(UUID userId);
}
