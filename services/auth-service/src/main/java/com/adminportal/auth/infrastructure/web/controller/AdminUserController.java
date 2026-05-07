package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.AdminUserCreateRequest;
import com.adminportal.auth.application.dto.request.AdminUserRoleUpdateRequest;
import com.adminportal.auth.application.dto.request.AdminUserUpdateRequest;
import com.adminportal.auth.application.dto.response.AdminUserDto;
import com.adminportal.auth.application.dto.response.AdminUserRoleOptionDto;
import com.adminportal.auth.application.service.AdminUserManagementService;
import com.adminportal.auth.infrastructure.security.Encrypted;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);

    private final AdminUserManagementService adminUserManagementService;

    public AdminUserController(AdminUserManagementService adminUserManagementService) {
        this.adminUserManagementService = adminUserManagementService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<List<AdminUserDto>> listUsers() {
        List<AdminUserDto> users = adminUserManagementService.listUsers();
        log.info("[ADMIN] Listed {} users", users.size());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/role-options")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<List<AdminUserRoleOptionDto>> listRoleOptions() {
        return ResponseEntity.ok(adminUserManagementService.listAssignableRoles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserManagementService.getUser(id));
    }

    @PostMapping
    @Encrypted
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> createUser(@Valid @RequestBody AdminUserCreateRequest request,
                                                   @RequestHeader("Idempotency-Key") String idempotencyKey) {
        AdminUserDto createdUser = adminUserManagementService.createUser(request);
        log.info("[ADMIN] Created user {} with role {}", createdUser.username(), createdUser.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PatchMapping("/{id}")
    @Encrypted
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> updateUser(@PathVariable UUID id,
                                                   @Valid @RequestBody AdminUserUpdateRequest request,
                                                   @RequestHeader("Idempotency-Key") String idempotencyKey) {
        AdminUserDto updatedUser = adminUserManagementService.updateUser(id, request);
        log.info("[ADMIN] Updated profile for user {}", updatedUser.username());
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> toggleActive(@PathVariable UUID id,
                                                     @RequestHeader("Idempotency-Key") String idempotencyKey) {
        AdminUserDto updatedUser = adminUserManagementService.toggleActive(id);
        log.info("[ADMIN] Toggled active status for user {}. Now active={}", updatedUser.username(), updatedUser.active());
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/{id}/role")
    @Encrypted
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<AdminUserDto> updateRole(@PathVariable UUID id,
                                                   @Valid @RequestBody AdminUserRoleUpdateRequest request,
                                                   @RequestHeader("Idempotency-Key") String idempotencyKey) {
        AdminUserDto updatedUser = adminUserManagementService.updateRole(id, request);
        log.info("[ADMIN] Updated role for user {} to {}", updatedUser.username(), updatedUser.role());
        return ResponseEntity.ok(updatedUser);
    }
}
