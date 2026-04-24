package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.Token;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TokenRepositoryPort {
    Token save(Token token);

    List<Token> saveAll(List<Token> tokens);

    Optional<Token> findByTokenJti(String tokenJti);

    List<Token> findActiveByUserId(UUID userId);

    void revokeAllByUserId(UUID userId);
}
