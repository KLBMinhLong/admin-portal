package com.adminportal.domain.infrastructure.persistence;

import com.adminportal.domain.application.port.out.ActiveTokenQueryPort;
import jakarta.persistence.EntityManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ActiveTokenQueryAdapter implements ActiveTokenQueryPort {

    private static final String TOKEN_KEY_PREFIX = "token:";

    private final EntityManager entityManager;
    private final StringRedisTemplate redisTemplate;

    public ActiveTokenQueryAdapter(EntityManager entityManager, StringRedisTemplate redisTemplate) {
        this.entityManager = entityManager;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean isActive(String tokenJti) {
        try {
            Boolean redisHit = redisTemplate.hasKey(TOKEN_KEY_PREFIX + tokenJti);
            if (Boolean.TRUE.equals(redisHit)) {
                return true;
            }
        } catch (RuntimeException ignored) {
            // Redis chỉ là fast path; DB mới là source of truth.
        }

        Number count = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*)
                FROM auth_tokens
                WHERE token_jti = :tokenJti
                  AND is_active = TRUE
                """)
            .setParameter("tokenJti", tokenJti)
            .getSingleResult();

        return count.longValue() > 0;
    }
}
