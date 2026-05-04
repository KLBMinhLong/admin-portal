package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.AssignPermissionsRequest;
import com.adminportal.auth.application.dto.request.AssignRolesRequest;
import com.adminportal.auth.application.dto.response.RolePermissionAssignmentResponse;
import com.adminportal.auth.application.dto.response.UserPermissionsResponse;
import com.adminportal.auth.application.dto.response.UserRoleAssignmentResponse;
import com.adminportal.auth.application.port.in.AssignRolePermissionsUseCase;
import com.adminportal.auth.application.port.in.AssignUserRolesUseCase;
import com.adminportal.auth.application.port.in.GetUserPermissionsUseCase;
import com.adminportal.auth.infrastructure.security.Encrypted;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminRbacController {

    private final AssignUserRolesUseCase assignUserRolesUseCase;
    private final AssignRolePermissionsUseCase assignRolePermissionsUseCase;
    private final GetUserPermissionsUseCase getUserPermissionsUseCase;

    public AdminRbacController(AssignUserRolesUseCase assignUserRolesUseCase,
                               AssignRolePermissionsUseCase assignRolePermissionsUseCase,
                               GetUserPermissionsUseCase getUserPermissionsUseCase) {
        this.assignUserRolesUseCase = assignUserRolesUseCase;
        this.assignRolePermissionsUseCase = assignRolePermissionsUseCase;
        this.getUserPermissionsUseCase = getUserPermissionsUseCase;
    }

    @PostMapping("/users/{id}/roles")
    @Encrypted
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<UserRoleAssignmentResponse> assignRoles(@PathVariable("id") UUID userId,
                                                                  @RequestHeader("Idempotency-Key") String idempotencyKey,
                                                                  @Valid @RequestBody AssignRolesRequest request) {
        return ResponseEntity.ok(assignUserRolesUseCase.execute(userId, request));
    }

    @PostMapping("/roles/{id}/permissions")
    @Encrypted
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('role.manage')")
    public ResponseEntity<RolePermissionAssignmentResponse> assignPermissions(@PathVariable("id") UUID roleId,
                                                                              @RequestHeader("Idempotency-Key") String idempotencyKey,
                                                                              @Valid @RequestBody AssignPermissionsRequest request) {
        return ResponseEntity.ok(assignRolePermissionsUseCase.execute(roleId, request));
    }

    @GetMapping("/users/{id}/permissions")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<UserPermissionsResponse> getUserPermissions(@PathVariable("id") UUID userId) {
        return ResponseEntity.ok(getUserPermissionsUseCase.execute(userId));
    }
}
