package com.adminportal.auth.application.port.out;

import java.time.Instant;

public record GeneratedToken(
    String value,
    String jti,
    Instant issuedAt
) {
}
