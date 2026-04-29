package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.Role;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface RoleRepositoryPort {
    Optional<Role> findById(UUID id);
    Optional<Role> findByIdWithPermissions(UUID id);
    Optional<Role> findByCode(String code);
    List<Role> findAllByIds(Set<UUID> ids);
    List<Role> findAllByCodes(Set<String> codes);
    List<Role> findAll();
    List<Role> findAllWithPermissions();
    Role save(Role role);
}
