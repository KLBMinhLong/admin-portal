package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.AssignRolesRequest;
import com.adminportal.auth.application.dto.response.UserRoleAssignmentResponse;
import com.adminportal.auth.application.port.in.AssignUserRolesUseCase;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.RbacAuditService;
import com.adminportal.auth.application.service.RuntimePermissionService;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
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
public class AssignUserRolesUseCaseImpl implements AssignUserRolesUseCase {

    private static final String REQUIRED_PERMISSION = "system.config";

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final RuntimePermissionService runtimePermissionService;
    private final RbacAuditService auditService;

    public AssignUserRolesUseCaseImpl(UserRepositoryPort userRepository,
                                      RoleRepositoryPort roleRepository,
                                      RuntimePermissionService runtimePermissionService,
                                      RbacAuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.runtimePermissionService = runtimePermissionService;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public UserRoleAssignmentResponse execute(UUID userId, AssignRolesRequest request) {
        runtimePermissionService.ensureCurrentUserHasPermission(REQUIRED_PERMISSION);
        validateRequest(request);

        User user = userRepository.findByIdWithRolesAndPermissions(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Set<Role> requestedRoles = resolveRoles(request);
        Set<Role> currentRoles = new LinkedHashSet<>(user.getRoles());

        // Calculate newly assigned roles (in requested but not in current)
        Set<Role> newlyAssignedRoles = requestedRoles.stream()
            .filter(role -> currentRoles.stream().noneMatch(existing -> existing.getId().equals(role.getId())))
            .collect(Collectors.toCollection(LinkedHashSet::new));

        // Calculate removed roles (in current but not in requested)
        Set<Role> removedRoles = currentRoles.stream()
            .filter(role -> requestedRoles.stream().noneMatch(existing -> existing.getId().equals(role.getId())))
            .collect(Collectors.toCollection(LinkedHashSet::new));

        // Replace roles (not merge) - set user roles to exactly what was requested
        user.assignRoles(requestedRoles);
        User savedUser = userRepository.save(user);

        String actor = runtimePermissionService.getCurrentUsername();
        Instant changedAt = Instant.now();

        // Audit newly assigned roles
        newlyAssignedRoles.forEach(role -> auditService.record(
            actor,
            "USER_ROLE_ASSIGNED",
            "USER",
            savedUser.getId().toString(),
            "role=" + role.getCode() + ", assigned_by=" + actor + ", assigned_at=" + changedAt
        ));

        // Audit removed roles
        removedRoles.forEach(role -> auditService.record(
            actor,
            "USER_ROLE_REMOVED",
            "USER",
            savedUser.getId().toString(),
            "role=" + role.getCode() + ", removed_by=" + actor + ", removed_at=" + changedAt
        ));

        return new UserRoleAssignmentResponse(
            savedUser.getId().toString(),
            savedUser.getUsername(),
            savedUser.getRoles().stream()
                .map(Role::getCode)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toCollection(LinkedHashSet::new)),
            actor,
            changedAt
        );
    }

    private Set<Role> resolveRoles(AssignRolesRequest request) {
        Set<UUID> ids = request.roleIds() == null ? Set.of() : request.roleIds();
        Set<String> codes = request.roleCodes() == null ? Set.of() : request.roleCodes().stream()
            .map(this::normalizeCode)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Role> roles = new LinkedHashSet<>();
        if (!ids.isEmpty()) {
            roles.addAll(roleRepository.findAllByIds(ids));
            if (roles.stream().map(Role::getId).collect(Collectors.toSet()).size() != ids.size()) {
                throw new ResourceNotFoundException("One or more roles were not found");
            }
        }
        if (!codes.isEmpty()) {
            Set<Role> rolesByCode = new LinkedHashSet<>(roleRepository.findAllByCodes(codes));
            if (rolesByCode.stream().map(role -> normalizeCode(role.getCode())).collect(Collectors.toSet()).size() != codes.size()) {
                throw new ResourceNotFoundException("One or more roles were not found");
            }
            roles.addAll(rolesByCode);
        }
        return roles;
    }

    private void validateRequest(AssignRolesRequest request) {
        boolean hasIds = request.roleIds() != null && !request.roleIds().isEmpty();
        boolean hasCodes = request.roleCodes() != null && !request.roleCodes().isEmpty();
        if (!hasIds && !hasCodes) {
            throw new IllegalArgumentException("At least one role id or role code is required");
        }
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase(Locale.ROOT);
    }
}
