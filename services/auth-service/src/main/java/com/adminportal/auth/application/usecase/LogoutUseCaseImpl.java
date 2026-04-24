package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.port.in.LogoutUseCase;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cam co token khong con hoat dong (dang xuat)
 */
@Service
@RequiredArgsConstructor
public class LogoutUseCaseImpl implements LogoutUseCase {
    private static final Logger log = LoggerFactory.getLogger(LogoutUseCaseImpl.class);

    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort      tokenCache;

    @Override
    @Transactional
    public void execute(String tokenValue) {
        tokenRepository.findByTokenValue(tokenValue).ifPresent(token -> {
            token.revoke();
            tokenRepository.save(token);
            tokenCache.evict(tokenValue);
            log.info("Token revoked on logout for userId={}", token.getUserId());
        });
    }
}
