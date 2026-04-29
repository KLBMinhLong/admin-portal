package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.response.AdminUserDto;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * UC-FE-04: Admin User Management API
 *
 * Endpoints:
 * - GET    /api/v1/admin/users          -> List all users
 * - GET    /api/v1/admin/users/{id}     -> Get user detail
 * - PATCH  /api/v1/admin/users/{id}/toggle-active -> Toggle active status
 * - PATCH  /api/v1/admin/users/{id}/role -> Update user role
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);

    private final UserRepositoryPort userRepository;

    public AdminUserController(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<List<AdminUserDto>> listUsers() {
        List<AdminUserDto> users = userRepository.findAll().stream()
            .map(AdminUserDto::from)
            .toList();
        log.info("[ADMIN] Listed {} users", users.size());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> getUser(@PathVariable UUID id) {
        return userRepository.findByIdWithRolesAndPermissions(id)
            .map(AdminUserDto::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> toggleActive(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") String idempotencyKey) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));

        user.toggleActive();
        userRepository.save(user);

        log.info("[ADMIN] Toggled active status for user {}. Now active={}", user.getUsername(), user.isActive());
        return ResponseEntity.ok(AdminUserDto.from(user));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> updateRole(
            @PathVariable UUID id,
            @RequestBody UpdateRoleRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));

        user.updateRole(request.role());
        userRepository.save(user);

        log.info("[ADMIN] Updated role for user {} to {}", user.getUsername(), request.role());
        return ResponseEntity.ok(AdminUserDto.from(user));
    }

    public record UpdateRoleRequest(String role) {}
}
