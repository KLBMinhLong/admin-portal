package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.infrastructure.security.Encrypted;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.RequestBody;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class AdminEncryptionContractTest {

    @Test
    void adminControllersShouldEncryptEndpointsThatConsumeRequestBodies() {
        assertRequestBodyMethodsAreEncrypted(AdminRbacController.class);
        assertRequestBodyMethodsAreEncrypted(AdminRolePermissionController.class);
        assertRequestBodyMethodsAreEncrypted(AdminUserController.class);
    }

    private static void assertRequestBodyMethodsAreEncrypted(Class<?> controllerClass) {
        for (Method method : controllerClass.getDeclaredMethods()) {
            boolean hasRequestBodyParameter = java.util.Arrays.stream(method.getParameters())
                .anyMatch(parameter -> parameter.isAnnotationPresent(RequestBody.class));

            if (!hasRequestBodyParameter) {
                continue;
            }

            assertThat(method.isAnnotationPresent(Encrypted.class))
                .as("%s#%s must be annotated with @Encrypted because frontend encrypts write request bodies",
                    controllerClass.getSimpleName(),
                    method.getName())
                .isTrue();
        }
    }
}
