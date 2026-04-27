package com.adminportal.auth.application.dto.response;

import java.time.Instant;
import java.util.Set;

public record RolePermissionAssignmentResponse(
    String roleId,
    String roleCode,
    Set<String> permissions,
    String assignedBy,
    Instant assignedAt
) {
}
