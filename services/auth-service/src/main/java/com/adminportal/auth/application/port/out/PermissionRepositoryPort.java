package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.Permission;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface PermissionRepositoryPort {
    List<Permission> findAllByIds(Set<UUID> ids);
    List<Permission> findAllByCodes(Set<String> codes);
}
