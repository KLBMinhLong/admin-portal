package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.AssignRolesRequest;
import com.adminportal.auth.application.dto.response.UserRoleAssignmentResponse;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssignUserRolesUseCaseImplTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RoleRepositoryPort roleRepository;

    @Mock
    private RbacAuditLogRepositoryPort auditLogRepository;

    private AssignUserRolesUseCaseImpl useCase;

    @BeforeEach
    void setUp() {
        RuntimePermissionService runtimePermissionService = new RuntimePermissionService(userRepository);
        RbacAuditService auditService = new RbacAuditService(auditLogRepository);
        useCase = new AssignUserRolesUseCaseImpl(userRepository, roleRepository, runtimePermissionService, auditService);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("admin", null, Set.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAssignRoleToUserAndWriteAuditLog() {
        Permission systemConfig = Permission.create("system.config", "System Config", "Manage RBAC", "system", "config");
        Role adminRole = Role.create("ADMIN", "Admin", "Admin role");
        adminRole.assignPermissions(Set.of(systemConfig));
        User adminUser = User.create("admin", "admin@example.com", "$2-hash", "ROLE_ADMIN");
        adminUser.assignRoles(Set.of(adminRole));

        Role departmentLead = Role.create("DEPARTMENT_LEAD", "Department Lead", "Approver");
        User targetUser = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER");

        when(userRepository.findByUsernameWithRolesAndPermissions("admin")).thenReturn(Optional.of(adminUser));
        when(userRepository.findByIdWithRolesAndPermissions(targetUser.getId())).thenReturn(Optional.of(targetUser));
        when(roleRepository.findAllByCodes(Set.of("DEPARTMENT_LEAD"))).thenReturn(java.util.List.of(departmentLead));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(auditLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserRoleAssignmentResponse response = useCase.execute(
            targetUser.getId(),
            new AssignRolesRequest(null, Set.of("department_lead"))
        );

        assertTrue(response.roles().contains("DEPARTMENT_LEAD"));
        assertTrue(targetUser.getRoles().stream().anyMatch(role -> "DEPARTMENT_LEAD".equals(role.getCode())));
        verify(auditLogRepository).save(any());
    }
}
