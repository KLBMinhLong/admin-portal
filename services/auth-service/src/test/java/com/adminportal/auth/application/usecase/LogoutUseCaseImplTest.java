package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogoutUseCaseImplTest {

    @Mock
    private TokenRepositoryPort tokenRepository;

    @Mock
    private TokenCachePort tokenCache;

    private JwtProvider jwtProvider;

    private LogoutUseCaseImpl logoutUseCase;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider("supersecretkey_changeme_in_production_min32chars");
        logoutUseCase = new LogoutUseCaseImpl(tokenRepository, tokenCache, jwtProvider);
    }

    @Test
    void shouldRevokeActiveTokenAndEvictCache() {
        User user = User.create("john", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");
        String jwtToken = jwtProvider.generate(user).value();
        String tokenJti = jwtProvider.parse(jwtToken).jti();
        Token token = Token.issue(user.getId(), tokenJti, "hash-1", Instant.now(), null, "Chrome");
        when(tokenRepository.findByTokenJti(tokenJti)).thenReturn(Optional.of(token));
        when(tokenRepository.save(any(Token.class))).thenAnswer(invocation -> invocation.getArgument(0));

        logoutUseCase.execute(jwtToken);

        verify(tokenRepository).save(token);
        verify(tokenCache).evict(tokenJti);
    }

    @Test
    void shouldNotSaveWhenTokenAlreadyRevoked() {
        User user = User.create("john", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");
        String jwtToken = jwtProvider.generate(user).value();
        String tokenJti = jwtProvider.parse(jwtToken).jti();
        Token token = Token.issue(user.getId(), tokenJti, "hash-2", Instant.now(), null, "Chrome");
        token.revoke();
        when(tokenRepository.findByTokenJti(tokenJti)).thenReturn(Optional.of(token));

        logoutUseCase.execute(jwtToken);

        verify(tokenRepository, never()).save(any(Token.class));
        verify(tokenCache).evict(tokenJti);
    }
}
