package com.adminportal.auth.application.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminUserRoleUpdateRequest(
    @NotBlank
    String roleCode
) {
}
