package com.adminportal.auth.application.dto.request;

import java.util.Set;
import java.util.UUID;

public record AssignRolesRequest(
    Set<UUID> roleIds,
    Set<String> roleCodes
) {
}
