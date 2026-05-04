package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.response.AdminAuditLogDto;
import com.adminportal.auth.application.dto.response.AdminPermissionDto;
import com.adminportal.auth.application.dto.response.AdminRoleDto;
import com.adminportal.auth.application.port.out.PermissionRepositoryPort;
import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.infrastructure.security.Encrypted;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * UC-FE-05: Quản lý Role & Permission Matrix
 * Endpoints:
 * - GET /api/v1/admin/roles -> List all roles with their assigned permissions
 * - GET /api/v1/admin/permissions -> List all permissions
 * - GET /api/v1/admin/audit-logs -> List RBAC audit logs
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminRolePermissionController {

    private static final Logger log = LoggerFactory.getLogger(AdminRolePermissionController.class);

    private final RoleRepositoryPort roleRepository;
    private final PermissionRepositoryPort permissionRepository;
    private final RbacAuditLogRepositoryPort auditLogRepository;
    private final com.adminportal.auth.application.port.in.RoleManagementUseCase roleManagementUseCase;

    public AdminRolePermissionController(RoleRepositoryPort roleRepository,
                                         PermissionRepositoryPort permissionRepository,
                                         RbacAuditLogRepositoryPort auditLogRepository,
                                         com.adminportal.auth.application.port.in.RoleManagementUseCase roleManagementUseCase) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.roleManagementUseCase = roleManagementUseCase;
    }

    @org.springframework.web.bind.annotation.PostMapping("/roles")
    @PreAuthorize("hasAuthority('role.manage')")
    @Encrypted
    public ResponseEntity<AdminRoleDto> createRole(@jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.adminportal.auth.application.dto.request.AdminRoleRequest request) {
        return ResponseEntity.ok(roleManagementUseCase.createRole(request));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('role.manage')")
    @Encrypted
    public ResponseEntity<AdminRoleDto> updateRole(@org.springframework.web.bind.annotation.PathVariable("id") java.util.UUID roleId,
                                                 @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.adminportal.auth.application.dto.request.AdminRoleRequest request) {
        return ResponseEntity.ok(roleManagementUseCase.updateRole(roleId, request));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/roles/{id}/toggle-active")
    @PreAuthorize("hasAuthority('role.manage')")
    public ResponseEntity<AdminRoleDto> toggleRoleActive(@org.springframework.web.bind.annotation.PathVariable("id") java.util.UUID roleId) {
        return ResponseEntity.ok(roleManagementUseCase.toggleRoleActive(roleId));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('role.manage')")
    public ResponseEntity<List<AdminRoleDto>> listRoles() {
        List<AdminRoleDto> roles = roleRepository.findAllWithPermissions().stream()
            .map(AdminRoleDto::from)
            .toList();
        log.info("[ADMIN] Listed {} roles", roles.size());
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('role.manage')")
    public ResponseEntity<List<AdminPermissionDto>> listPermissions() {
        List<AdminPermissionDto> permissions = permissionRepository.findAll().stream()
            .map(AdminPermissionDto::from)
            .toList();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('role.manage')")
    public ResponseEntity<List<AdminAuditLogDto>> listAuditLogs() {
        List<AdminAuditLogDto> logs = auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
            .map(AdminAuditLogDto::from)
            .toList();
        return ResponseEntity.ok(logs);
    }
}
