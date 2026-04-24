package com.adminportal.auth.infrastructure.cache;

import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.domain.entity.Token;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class RedisTokenCacheAdapter implements TokenCachePort {

    private static final String TOKEN_KEY_PREFIX = "token:";
    private static final Logger log = LoggerFactory.getLogger(RedisTokenCacheAdapter.class);

    private final StringRedisTemplate redisTemplate;

    public RedisTokenCacheAdapter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void put(Token token) {
        try {
            redisTemplate.opsForValue().set(buildKey(token.getTokenJti()), token.getUserId().toString());
        } catch (RuntimeException exception) {
            log.warn("Redis put failed for token jti={}, login will continue with DB as source of truth", token.getTokenJti());
        }
    }

    @Override
    public Optional<Token> get(String tokenJti) {
        try {
            String value = redisTemplate.opsForValue().get(buildKey(tokenJti));
            if (value == null) {
                return Optional.empty();
            }
            return Optional.of(Token.cached(tokenJti));
        } catch (RuntimeException exception) {
            log.warn("Redis get failed for token jti={}, falling back to DB", tokenJti);
            return Optional.empty();
        }
    }

    @Override
    public void evict(String tokenJti) {
        try {
            redisTemplate.delete(buildKey(tokenJti));
        } catch (RuntimeException exception) {
            log.warn("Redis evict failed for token jti={}, DB state remains authoritative", tokenJti);
        }
    }

    private String buildKey(String tokenJti) {
        return TOKEN_KEY_PREFIX + tokenJti;
    }
}
