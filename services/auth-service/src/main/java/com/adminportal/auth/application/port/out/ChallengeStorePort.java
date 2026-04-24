package com.adminportal.auth.application.port.out;

import java.util.Optional;
import java.util.UUID;

public interface ChallengeStorePort {
    String create(UUID userId, String deviceInfo);

    Optional<TwoFactorChallenge> find(String challenge);

    void delete(String challenge);
}
