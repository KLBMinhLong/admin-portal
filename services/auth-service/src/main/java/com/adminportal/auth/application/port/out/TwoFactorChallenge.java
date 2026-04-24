package com.adminportal.auth.application.port.out;

import java.util.UUID;

public record TwoFactorChallenge(
    UUID userId,
    String deviceInfo
) {
}
