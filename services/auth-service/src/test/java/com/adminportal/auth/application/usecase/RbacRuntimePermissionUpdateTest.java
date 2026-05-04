package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.AssignPermissionsRequest;
import com.adminportal.auth.application.dto.response.UserPermissionsResponse;
import com.adminportal.auth.application.port.out.PermissionRepositoryPort;
import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.services.RbacAuditService;
import com.adminportal.auth.application.services.RuntimePermissionService;
import com.adminportal.auth.domain.entity.Permission;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RbacRuntimePermissionUpdateTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RoleRepositoryPort roleRepository;

    @Mock
    private PermissionRepositoryPort permissionRepository;

    @Mock
    private RbacAuditLogRepositoryPort auditLogRepository;

    private AssignRolePermissionsUseCaseImpl assignRolePermissionsUseCase;
    private GetUserPermissionsUseCaseImpl getUserPermissionsUseCase;

    @BeforeEach
    void setUp() {
        RuntimePermissionService runtimePermissionService = new RuntimePermissionService(userRepository);
        RbacAuditService auditService = new RbacAuditService(auditLogRepository);
        assignRolePermissionsUseCase = new AssignRolePermissionsUseCaseImpl(
            roleRepository,
            permissionRepository,
            runtimePermissionService,
            auditService
        );
        getUserPermissionsUseCase = new GetUserPermissionsUseCaseImpl(userRepository, runtimePermissionService);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("admin", null, Set.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldExposeNewPermissionOnNextLookupWithoutRelogin() {
        Permission systemConfig = Permission.create("system.config", "System Config", "Manage RBAC", "system", "config");
        Permission roleManage = Permission.create("role.manage", "Role Manage", "Manage roles", "role", "manage");
        Permission reportView = Permission.create("report.view", "View Report", "View reports", "report", "view");

        Role adminRole = Role.create("ADMIN", "Admin", "Admin role");
        adminRole.assignPermissions(Set.of(systemConfig, roleManage));
        User adminUser = User.create("admin", "admin@example.com", "$2-hash", "ROLE_ADMIN");
        adminUser.assignRoles(Set.of(adminRole));

        Role userRole = Role.create("USER", "User", "Default role");
        User targetUser = User.create("jane.doe", "jane@example.com", "$2-hash", "ROLE_USER");
        targetUser.assignRoles(Set.of(userRole));

        when(userRepository.findByUsernameWithRolesAndPermissions("admin")).thenReturn(Optional.of(adminUser));
        when(roleRepository.findByIdWithPermissions(userRole.getId())).thenReturn(Optional.of(userRole));
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(permissionRepository.findAllByCodes(Set.of("report.view"))).thenReturn(java.util.List.of(reportView));
        when(auditLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByIdWithRolesAndPermissions(targetUser.getId())).thenReturn(Optional.of(targetUser));

        assignRolePermissionsUseCase.execute(
            userRole.getId(),
            new AssignPermissionsRequest(null, Set.of("report.view"))
        );

        UserPermissionsResponse response = getUserPermissionsUseCase.execute(targetUser.getId());

        assertTrue(response.permissions().contains("report.view"));
    }
}
