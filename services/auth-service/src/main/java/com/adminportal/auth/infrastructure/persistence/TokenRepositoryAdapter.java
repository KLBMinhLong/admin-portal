package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.domain.entity.Token;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class TokenRepositoryAdapter implements TokenRepositoryPort {

    private final SpringDataTokenRepository repository;

    public TokenRepositoryAdapter(SpringDataTokenRepository repository) {
        this.repository = repository;
    }

    @Override
    public Token save(Token token) {
        return repository.save(token);
    }

    @Override
    public List<Token> saveAll(List<Token> tokens) {
        return repository.saveAll(tokens);
    }

    @Override
    public Optional<Token> findByTokenJti(String tokenJti) {
        return repository.findByTokenJti(tokenJti);
    }

    @Override
    public List<Token> findActiveByUserId(UUID userId) {
        return repository.findActiveByUserIdForUpdate(userId);
    }

    @Override
    public void revokeAllByUserId(UUID userId) {
        repository.revokeAllByUserId(userId, Instant.now());
    }
}
