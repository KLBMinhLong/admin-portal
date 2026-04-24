package com.adminportal.auth.application.port.out;
import com.adminportal.auth.domain.entity.Token;
import java.util.Optional;
public interface TokenCachePort {
    void put(String tokenValue, Token token);
    Optional<Token> get(String tokenValue);
    void evict(String tokenValue);
}
