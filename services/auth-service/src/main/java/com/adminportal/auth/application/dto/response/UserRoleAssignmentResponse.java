package com.adminportal.auth.application.dto.response;

import java.time.Instant;
import java.util.Set;

public record UserRoleAssignmentResponse(
    String userId,
    String username,
    Set<String> roles,
    String assignedBy,
    Instant assignedAt
) {
}
