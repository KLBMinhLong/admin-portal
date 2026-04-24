package com.adminportal.auth.application.port.out;
import com.adminportal.auth.domain.entity.Token;
import java.util.Optional;
import java.util.UUID;
public interface TokenRepositoryPort {
    Token save(Token token);
    Optional<Token> findByTokenValue(String tokenValue);
    Optional<Token> findActiveByUserId(UUID userId);
    void revokeAllByUserId(UUID userId);
}
