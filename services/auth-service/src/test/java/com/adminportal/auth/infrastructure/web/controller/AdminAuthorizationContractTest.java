package com.adminportal.auth.infrastructure.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class AdminAuthorizationContractTest {

    private static final String USER_MANAGEMENT_RULE = "hasAuthority('system.config') and hasAuthority('user.manage')";
    private static final String ROLE_MANAGEMENT_RULE = "hasAuthority('system.config') and hasAuthority('role.manage')";

    @Test
    void adminUserEndpointsShouldRequireSystemConfigAndUserManage() {
        assertMappedMethodsUseRule(AdminUserController.class, USER_MANAGEMENT_RULE);
    }

    @Test
    void adminRoleEndpointsShouldRequireSystemConfigAndRoleManage() {
        assertMappedMethodsUseRule(AdminRolePermissionController.class, ROLE_MANAGEMENT_RULE);
    }

    @Test
    void adminRbacEndpointsShouldRequireMatchingRbacRules() throws NoSuchMethodException {
        assertMethodRule(AdminRbacController.class.getDeclaredMethod(
            "assignRoles",
            java.util.UUID.class,
            String.class,
            com.adminportal.auth.application.dto.request.AssignRolesRequest.class
        ), USER_MANAGEMENT_RULE);

        assertMethodRule(AdminRbacController.class.getDeclaredMethod(
            "getUserPermissions",
            java.util.UUID.class
        ), USER_MANAGEMENT_RULE);

        assertMethodRule(AdminRbacController.class.getDeclaredMethod(
            "assignPermissions",
            java.util.UUID.class,
            String.class,
            com.adminportal.auth.application.dto.request.AssignPermissionsRequest.class
        ), ROLE_MANAGEMENT_RULE);
    }

    private static void assertMappedMethodsUseRule(Class<?> controllerClass, String expectedRule) {
        for (Method method : controllerClass.getDeclaredMethods()) {
            if (!isEndpointMethod(method)) {
                continue;
            }
            assertMethodRule(method, expectedRule);
        }
    }

    private static boolean isEndpointMethod(Method method) {
        return method.isAnnotationPresent(GetMapping.class)
            || method.isAnnotationPresent(PostMapping.class)
            || method.isAnnotationPresent(PatchMapping.class);
    }

    private static void assertMethodRule(Method method, String expectedRule) {
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
            .as("%s#%s must declare @PreAuthorize", method.getDeclaringClass().getSimpleName(), method.getName())
            .isNotNull();
        assertThat(annotation.value())
            .as("%s#%s must enforce the expected RBAC rule", method.getDeclaringClass().getSimpleName(), method.getName())
            .isEqualTo(expectedRule);
    }
}
