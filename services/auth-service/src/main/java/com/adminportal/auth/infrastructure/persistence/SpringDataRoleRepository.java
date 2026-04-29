package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.domain.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataRoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByCode(String code);

    @EntityGraph(attributePaths = {"permissions"})
    @Query("select r from Role r where r.id = :id")
    Optional<Role> findByIdWithPermissions(UUID id);

    List<Role> findAllByIdIn(Collection<UUID> ids);

    List<Role> findAllByCodeIn(Collection<String> codes);

    @EntityGraph(attributePaths = {"permissions"})
    @Query("select r from Role r")
    List<Role> findAllWithPermissions();
}
