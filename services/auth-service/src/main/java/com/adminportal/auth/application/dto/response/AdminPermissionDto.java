package com.adminportal.auth.application.dto.response;

import com.adminportal.auth.domain.entity.Permission;
import java.util.UUID;

public record AdminPermissionDto(
    UUID id,
    String code,
    String name,
    String description,
    String resource,
    String action
) {
    public static AdminPermissionDto from(Permission p) {
        return new AdminPermissionDto(
            p.getId(), p.getCode(), p.getName(),
            p.getDescription(), p.getResource(), p.getAction()
        );
    }
}
