package com.adminportal.auth.application.dto.response;

import java.time.Instant;

public record ProfileDto(
    String username,
    String email,
    String role,
    String firstName,
    String lastName,
    boolean twoFactorEnabled,
    Instant createdAt
) {}
