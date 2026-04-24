package com.adminportal.auth.application.services;

import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.domain.entity.Token;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserSessionRevocationService {
    private static final Logger log = LoggerFactory.getLogger(UserSessionRevocationService.class);

    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort tokenCache;

    public UserSessionRevocationService(TokenRepositoryPort tokenRepository, TokenCachePort tokenCache) {
        this.tokenRepository = tokenRepository;
        this.tokenCache = tokenCache;
    }

    public void revokeAll(UUID userId) {
        List<Token> activeTokens = tokenRepository.findActiveByUserId(userId);
        if (activeTokens.isEmpty()) {
            return;
        }

        log.info("Revoking {} active token(s) for userId={}", activeTokens.size(), userId);
        activeTokens.forEach(token -> {
            token.revoke();
            tokenCache.evict(token.getTokenJti());
        });
        tokenRepository.saveAll(activeTokens);
    }

    public void storeNewSession(Token token) {
        tokenRepository.save(token);
        tokenCache.put(token);
    }
}
