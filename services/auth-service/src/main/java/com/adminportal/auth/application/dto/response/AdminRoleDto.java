package com.adminportal.auth.application.dto.response;

import com.adminportal.auth.domain.entity.Role;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record AdminRoleDto(
    UUID id,
    String code,
    String name,
    String description,
    boolean active,
    Set<String> permissionCodes
) {
    public static AdminRoleDto from(Role role) {
        return new AdminRoleDto(
            role.getId(),
            role.getCode(),
            role.getName(),
            role.getDescription(),
            role.isActive(),
            role.getPermissions().stream()
                .map(p -> p.getCode())
                .collect(Collectors.toSet())
        );
    }
}
