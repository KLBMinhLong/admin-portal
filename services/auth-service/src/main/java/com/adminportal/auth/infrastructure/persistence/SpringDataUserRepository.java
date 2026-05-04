package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.domain.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdWithRolesAndPermissions(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.username = :username")
    Optional<User> findByUsernameForUpdate(String username);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("select u from User u where u.username = :username")
    Optional<User> findByUsernameWithRolesAndPermissions(String username);

    @EntityGraph(attributePaths = {"roles"})
    @Query("select u from User u order by u.createdAt desc")
    List<User> findAllWithRoles();
}
