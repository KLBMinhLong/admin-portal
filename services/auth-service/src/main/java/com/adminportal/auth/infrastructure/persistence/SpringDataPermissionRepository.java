package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.domain.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

interface SpringDataPermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findAllByIdIn(Collection<UUID> ids);

    List<Permission> findAllByCodeIn(Collection<String> codes);
}
