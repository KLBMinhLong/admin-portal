package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.adminportal.auth.domain.entity.PasswordResetToken;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PasswordResetTokenRepositoryAdapter implements PasswordResetTokenRepositoryPort {

    private final SpringDataPasswordResetTokenRepository repository;

    public PasswordResetTokenRepositoryAdapter(SpringDataPasswordResetTokenRepository repository) {
        this.repository = repository;
    }

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        return repository.save(token);
    }

    @Override
    public List<PasswordResetToken> saveAll(List<PasswordResetToken> tokens) {
        return repository.saveAll(tokens);
    }

    @Override
    public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
        return repository.findByTokenHash(tokenHash);
    }

    @Override
    public List<PasswordResetToken> findActiveByUserId(UUID userId) {
        return repository.findActiveByUserId(userId);
    }
}
