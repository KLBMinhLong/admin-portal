package com.adminportal.auth.application.dto.response;

import com.adminportal.auth.domain.entity.Role;

import java.util.UUID;

public record AdminUserRoleOptionDto(
    UUID id,
    String code,
    String name,
    String description
) {
    public static AdminUserRoleOptionDto from(Role role) {
        return new AdminUserRoleOptionDto(
            role.getId(),
            role.getCode(),
            role.getName(),
            role.getDescription()
        );
    }
}
