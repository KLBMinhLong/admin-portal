package com.adminportal.auth.application.dto.request;

import java.util.Set;
import java.util.UUID;

public record AssignPermissionsRequest(
    Set<UUID> permissionIds,
    Set<String> permissionCodes
) {
}
