package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.Token;

import java.util.Optional;

public interface TokenCachePort {
    void put(Token token);

    Optional<Token> get(String tokenJti);

    void evict(String tokenJti);
}
