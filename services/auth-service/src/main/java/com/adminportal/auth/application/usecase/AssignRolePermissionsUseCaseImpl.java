package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.AssignPermissionsRequest;
import com.adminportal.auth.application.dto.response.RolePermissionAssignmentResponse;
import com.adminportal.auth.application.port.in.AssignRolePermissionsUseCase;
import com.adminportal.auth.application.port.out.PermissionRepositoryPort;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.service.RbacAuditService;
import com.adminportal.auth.application.service.RuntimePermissionService;
import com.adminportal.auth.domain.entity.Permission;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssignRolePermissionsUseCaseImpl implements AssignRolePermissionsUseCase {

    private static final String REQUIRED_PERMISSION = "role.manage";

    private final RoleRepositoryPort roleRepository;
    private final PermissionRepositoryPort permissionRepository;
    private final RuntimePermissionService runtimePermissionService;
    private final RbacAuditService auditService;

    public AssignRolePermissionsUseCaseImpl(RoleRepositoryPort roleRepository,
                                            PermissionRepositoryPort permissionRepository,
                                            RuntimePermissionService runtimePermissionService,
                                            RbacAuditService auditService) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.runtimePermissionService = runtimePermissionService;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public RolePermissionAssignmentResponse execute(UUID roleId, AssignPermissionsRequest request) {
        runtimePermissionService.ensureCurrentUserHasPermission(REQUIRED_PERMISSION);
        validateRequest(request);

        Role role = roleRepository.findByIdWithPermissions(roleId)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));

        Set<Permission> requestedPermissions = resolvePermissions(request);
        
        // Replace permissions instead of merging for Matrix UI
        role.assignPermissions(requestedPermissions);
        Role savedRole = roleRepository.save(role);

        String actor = runtimePermissionService.getCurrentUsername();
        Instant assignedAt = Instant.now();
        
        // Record audit
        auditService.record(
            actor,
            "ROLE_PERMISSIONS_UPDATED",
            "ROLE",
            savedRole.getId().toString(),
            "Permissions updated to: " + requestedPermissions.stream().map(Permission::getCode).collect(Collectors.joining(", "))
        );

        return new RolePermissionAssignmentResponse(
            savedRole.getId().toString(),
            savedRole.getCode(),
            savedRole.getPermissions().stream()
                .map(Permission::getCode)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toCollection(LinkedHashSet::new)),
            actor,
            assignedAt
        );
    }

    private Set<Permission> resolvePermissions(AssignPermissionsRequest request) {
        Set<UUID> ids = request.permissionIds() == null ? Set.of() : request.permissionIds();
        Set<String> codes = request.permissionCodes() == null ? Set.of() : request.permissionCodes().stream()
            .map(this::normalizeCode)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Permission> permissions = new LinkedHashSet<>();
        if (!ids.isEmpty()) {
            permissions.addAll(permissionRepository.findAllByIds(ids));
            if (permissions.stream().map(Permission::getId).collect(Collectors.toSet()).size() != ids.size()) {
                throw new ResourceNotFoundException("One or more permissions were not found");
            }
        }
        if (!codes.isEmpty()) {
            Set<Permission> permissionsByCode = new LinkedHashSet<>(permissionRepository.findAllByCodes(codes));
            if (permissionsByCode.stream().map(permission -> normalizeCode(permission.getCode())).collect(Collectors.toSet()).size() != codes.size()) {
                throw new ResourceNotFoundException("One or more permissions were not found");
            }
            permissions.addAll(permissionsByCode);
        }
        return permissions;
    }

    private void validateRequest(AssignPermissionsRequest request) {
        // Allow empty requests to clear all permissions
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toLowerCase(Locale.ROOT);
    }
}
