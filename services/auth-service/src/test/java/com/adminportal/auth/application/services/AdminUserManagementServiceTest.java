package com.adminportal.auth.application.services;

import com.adminportal.auth.application.dto.request.AdminUserCreateRequest;
import com.adminportal.auth.application.dto.request.AdminUserRoleUpdateRequest;
import com.adminportal.auth.application.dto.request.AdminUserUpdateRequest;
import com.adminportal.auth.application.dto.response.AdminUserDto;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.adminportal.auth.application.services.UsernamePasswordHashService;

import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserManagementServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RoleRepositoryPort roleRepository;

    @Mock
    private UsernamePasswordHashService passwordHashService;

    private AdminUserManagementService adminUserManagementService;

    @BeforeEach
    void setUp() {
        adminUserManagementService = new AdminUserManagementService(userRepository, roleRepository, passwordHashService);
    }

    @Test
    void shouldCreateUserWithNormalizedUserRoleAndAssignedRbacRole() {
        Role userRole = Role.create("USER", "User", "Default user role");
        when(userRepository.findByUsername("new_user")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new.user@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByCode("USER")).thenReturn(Optional.of(userRole));
        when(passwordHashService.encode("new_user", "StrongPassword@123")).thenReturn("$2-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserDto createdUser = adminUserManagementService.createUser(new AdminUserCreateRequest(
            "new_user",
            "new.user@example.com",
            "StrongPassword@123",
            "New",
            "User",
            "user",
            true
        ));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getRole()).isEqualTo("ROLE_USER");
        assertThat(savedUser.getRoles()).extracting(Role::getCode).containsExactly("USER");
        assertThat(createdUser.role()).isEqualTo("USER");
        assertThat(createdUser.roles()).containsExactly("USER");
    }

    @Test
    void shouldSynchronizePrimaryRoleAndRbacRoleWhenUpdatingRole() {
        Role previousRole = Role.create("USER", "User", "Default user role");
        Role adminRole = Role.create("ADMIN", "Admin", "Administrator role");
        User user = User.create("john_doe", "john@example.com", "$2-hash", "ROLE_USER");
        user.assignRoles(new LinkedHashSet<>(Set.of(previousRole)));

        when(userRepository.findByIdWithRolesAndPermissions(user.getId())).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserDto updatedUser = adminUserManagementService.updateRole(
            user.getId(),
            new AdminUserRoleUpdateRequest("admin")
        );

        assertThat(user.getRole()).isEqualTo("ROLE_ADMIN");
        assertThat(user.getRoles()).extracting(Role::getCode).containsExactly("ADMIN");
        assertThat(updatedUser.role()).isEqualTo("ADMIN");
        assertThat(updatedUser.roles()).containsExactly("ADMIN");
    }

    @Test
    void shouldUpdateProfileWithoutChangingAssignedRoles() {
        Role userRole = Role.create("USER", "User", "Default user role");
        User user = User.create("jane_doe", "jane@example.com", "$2-hash", "ROLE_USER");
        user.assignRoles(new LinkedHashSet<>(Set.of(userRole)));

        when(userRepository.findByIdWithRolesAndPermissions(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("jane.updated@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserDto updatedUser = adminUserManagementService.updateUser(
            user.getId(),
            new AdminUserUpdateRequest("jane.updated@example.com", "Jane", "Updated")
        );

        assertThat(updatedUser.email()).isEqualTo("jane.updated@example.com");
        assertThat(updatedUser.firstName()).isEqualTo("Jane");
        assertThat(updatedUser.lastName()).isEqualTo("Updated");
        assertThat(updatedUser.role()).isEqualTo("USER");
        assertThat(updatedUser.roles()).containsExactly("USER");
    }
}
