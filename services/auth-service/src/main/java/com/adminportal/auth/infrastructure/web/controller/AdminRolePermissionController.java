package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.AdminRoleRequest;
import com.adminportal.auth.application.dto.response.AdminAuditLogDto;
import com.adminportal.auth.application.dto.response.AdminPermissionDto;
import com.adminportal.auth.application.dto.response.AdminRoleDto;
import com.adminportal.auth.application.dto.response.ApiResponse;
import com.adminportal.auth.application.port.in.RoleManagementUseCase;
import com.adminportal.auth.infrastructure.security.Encrypted;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * UC-FE-05: Quản lý Role & Permission Matrix
 * Endpoints:
 * - GET /api/v1/admin/roles -> List all roles with their assigned permissions
 * - GET /api/v1/admin/permissions -> List all permissions
 * - GET /api/v1/admin/audit-logs -> List RBAC audit logs
 */
@RestController
@RequestMapping("/api/v1/admin")
@Slf4j
public class AdminRolePermissionController {

    private static final Logger log = LoggerFactory.getLogger(AdminRolePermissionController.class);

    private final RoleManagementUseCase roleManagementUseCase;

    public AdminRolePermissionController(RoleManagementUseCase roleManagementUseCase) {
        this.roleManagementUseCase = roleManagementUseCase;
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('role.manage')")
    @Encrypted
    public ResponseEntity<ApiResponse<AdminRoleDto>> createRole(@Valid @RequestBody AdminRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(roleManagementUseCase.createRole(request)));
    }

    @PatchMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('role.manage')")
    @Encrypted
    public ResponseEntity<ApiResponse<AdminRoleDto>> updateRole(@PathVariable("id") UUID roleId,
                                                                @Valid @RequestBody AdminRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(roleManagementUseCase.updateRole(roleId, request)));
    }

    @PatchMapping("/roles/{id}/toggle-active")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('role.manage')")
    public ResponseEntity<ApiResponse<AdminRoleDto>> toggleRoleActive(@PathVariable("id") UUID roleId) {
        return ResponseEntity.ok(ApiResponse.ok(roleManagementUseCase.toggleRoleActive(roleId)));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('role.view')")
    public ResponseEntity<ApiResponse<List<AdminRoleDto>>> listRoles() {
        List<AdminRoleDto> roles = roleManagementUseCase.listRoles();
        log.info("[ADMIN] Listed {} roles", roles.size());
        return ResponseEntity.ok(ApiResponse.ok(roles));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('permission.view')")
    public ResponseEntity<ApiResponse<List<AdminPermissionDto>>> listPermissions() {
        return ResponseEntity.ok(ApiResponse.ok(roleManagementUseCase.listPermissions()));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('audit.view')")
    public ResponseEntity<ApiResponse<List<AdminAuditLogDto>>> listAuditLogs() {
        return ResponseEntity.ok(ApiResponse.ok(roleManagementUseCase.listAuditLogs()));
    }
}
