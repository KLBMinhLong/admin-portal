package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.AssignRolesRequest;
import com.adminportal.auth.application.dto.response.UserRoleAssignmentResponse;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.RbacAuditService;
import com.adminportal.auth.application.service.RuntimePermissionService;
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
import java.util.List;

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
    private RuntimePermissionService runtimePermissionService;
    @Mock
    private RbacAuditService auditService;

    private AssignUserRolesUseCaseImpl useCase;

    @BeforeEach
    void setUp() {
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
        User adminUser = User.create("admin", "admin@example.com", "$2-hash", "ROLE_ADMIN", "Admin", "User");
        adminUser.assignRoles(Set.of(adminRole));

        Role departmentLead = Role.create("DEPARTMENT_LEAD", "Department Lead", "Approver");
        User targetUser = User.create("john.doe", "john@example.com", "$2-hash", "ROLE_USER", "John", "Doe");

        when(userRepository.findByUsernameWithRolesAndPermissions("admin")).thenReturn(Optional.of(adminUser));
        when(userRepository.findByIdWithRolesAndPermissions(targetUser.getId())).thenReturn(Optional.of(targetUser));
        when(roleRepository.findAllByCodes(Set.of("DEPARTMENT_LEAD"))).thenReturn(List.of(departmentLead));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserRoleAssignmentResponse response = useCase.execute(
            targetUser.getId(),
            new AssignRolesRequest(null, Set.of("department_lead"))
        );

        assertTrue(response.roles().contains("DEPARTMENT_LEAD"));
        verify(auditService).record(eq("admin"), eq("ASSIGN_ROLES"), eq("USER"), anyString(), anyString());
    }
}
