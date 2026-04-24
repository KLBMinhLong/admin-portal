package com.adminportal.auth.infrastructure.cache;

import com.adminportal.auth.application.port.out.ChallengeStorePort;
import com.adminportal.auth.application.port.out.TwoFactorChallenge;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Component
public class RedisChallengeStoreAdapter implements ChallengeStorePort {
    private static final String CHALLENGE_KEY_PREFIX = "2fa:challenge:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final long challengeTtlMinutes;

    public RedisChallengeStoreAdapter(StringRedisTemplate redisTemplate,
                                      ObjectMapper objectMapper,
                                      @Value("${app.two-factor.challenge-ttl-minutes:5}") long challengeTtlMinutes) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.challengeTtlMinutes = challengeTtlMinutes;
    }

    @Override
    public String create(UUID userId, String deviceInfo) {
        String challenge = "2fa_challenge_" + UUID.randomUUID();
        TwoFactorChallenge payload = new TwoFactorChallenge(userId, deviceInfo);
        try {
            redisTemplate.opsForValue().set(
                buildKey(challenge),
                objectMapper.writeValueAsString(payload),
                Duration.ofMinutes(challengeTtlMinutes)
            );
            return challenge;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize 2FA challenge", exception);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Failed to store 2FA challenge", exception);
        }
    }

    @Override
    public Optional<TwoFactorChallenge> find(String challenge) {
        try {
            String payload = redisTemplate.opsForValue().get(buildKey(challenge));
            if (payload == null) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(payload, TwoFactorChallenge.class));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize 2FA challenge", exception);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Failed to read 2FA challenge", exception);
        }
    }

    @Override
    public void delete(String challenge) {
        try {
            redisTemplate.delete(buildKey(challenge));
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Failed to delete 2FA challenge", exception);
        }
    }

    private String buildKey(String challenge) {
        return CHALLENGE_KEY_PREFIX + challenge;
    }
}
