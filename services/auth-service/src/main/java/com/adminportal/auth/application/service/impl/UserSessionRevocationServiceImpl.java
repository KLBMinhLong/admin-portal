package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.service.UserSessionRevocationService;
import com.adminportal.auth.domain.entity.Token;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class UserSessionRevocationServiceImpl implements UserSessionRevocationService {

    private static final Logger log = LoggerFactory.getLogger(UserSessionRevocationServiceImpl.class);

    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort tokenCache;

    public UserSessionRevocationServiceImpl(TokenRepositoryPort tokenRepository, TokenCachePort tokenCache) {
        this.tokenRepository = tokenRepository;
        this.tokenCache = tokenCache;
    }

    @Override
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

    @Override
    public void storeNewSession(Token token) {
        tokenRepository.save(token);
        tokenCache.put(token);
        log.debug("Stored new session for tokenJti={}", token.getTokenJti());
    }
}
