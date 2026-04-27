package com.adminportal.auth.application.dto.response;

import java.util.Set;

public record UserPermissionsResponse(
    String userId,
    String username,
    Set<String> roles,
    Set<String> permissions
) {
}
