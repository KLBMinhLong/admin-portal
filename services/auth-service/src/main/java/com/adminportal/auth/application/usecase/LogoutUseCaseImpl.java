package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.port.in.LogoutUseCase;
import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.infrastructure.security.JwtProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cam co token khong con hoat dong (dang xuat)
 */
@Service
public class LogoutUseCaseImpl implements LogoutUseCase {
    private static final Logger log = LoggerFactory.getLogger(LogoutUseCaseImpl.class);

    private final TokenRepositoryPort tokenRepository;
    private final TokenCachePort      tokenCache;
    private final JwtProvider jwtProvider;

    public LogoutUseCaseImpl(TokenRepositoryPort tokenRepository,
                             TokenCachePort tokenCache,
                             JwtProvider jwtProvider) {
        this.tokenRepository = tokenRepository;
        this.tokenCache = tokenCache;
        this.jwtProvider = jwtProvider;
    }

    @Override
    @Transactional
    public void execute(String tokenValue) {
        String tokenJti = jwtProvider.parse(tokenValue).jti();
        tokenRepository.findByTokenJti(tokenJti).ifPresent(token -> {
            token.revoke();
            tokenRepository.save(token);
            tokenCache.evict(tokenJti);
            log.info("Token revoked on logout for userId={}", token.getUserId());
        });
    }
}
