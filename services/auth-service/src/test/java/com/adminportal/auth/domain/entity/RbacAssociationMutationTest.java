package com.adminportal.auth.domain.entity;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.LinkedHashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RbacAssociationMutationTest {

    @Test
    void shouldKeepSamePermissionCollectionWhenReassigningRolePermissions() throws Exception {
        Role role = Role.create("RBAC_MUTATION_ROLE", "RBAC Mutation Role", "Role mutation regression test");
        Permission permissionA = Permission.create("rbac.permission.a", "Permission A", "Permission A", "rbac", "a");
        Permission permissionB = Permission.create("rbac.permission.b", "Permission B", "Permission B", "rbac", "b");

        Set<Permission> originalBackingSet = getFieldValue(role, "permissions");

        role.assignPermissions(new LinkedHashSet<>(Set.of(permissionA)));
        role.assignPermissions(new LinkedHashSet<>(Set.of(permissionA, permissionB)));

        Set<Permission> updatedBackingSet = getFieldValue(role, "permissions");

        assertThat(updatedBackingSet).isSameAs(originalBackingSet);
        assertThat(updatedBackingSet)
            .extracting(Permission::getCode)
            .containsExactlyInAnyOrder("rbac.permission.a", "rbac.permission.b");
    }

    @Test
    void shouldKeepSameRoleCollectionWhenReassigningUserRoles() throws Exception {
        User user = User.create("rbac_mutation_user", "rbac_mutation_user@example.com", "$2-test-hash", "ROLE_USER");
        Role roleA = Role.create("RBAC_ROLE_A", "RBAC Role A", "Role A");
        Role roleB = Role.create("RBAC_ROLE_B", "RBAC Role B", "Role B");

        Set<Role> originalBackingSet = getFieldValue(user, "roles");

        user.assignRoles(new LinkedHashSet<>(Set.of(roleA)));
        user.assignRoles(new LinkedHashSet<>(Set.of(roleA, roleB)));

        Set<Role> updatedBackingSet = getFieldValue(user, "roles");

        assertThat(updatedBackingSet).isSameAs(originalBackingSet);
        assertThat(updatedBackingSet)
            .extracting(Role::getCode)
            .containsExactlyInAnyOrder("RBAC_ROLE_A", "RBAC_ROLE_B");
    }

    @SuppressWarnings("unchecked")
    private static <T> Set<T> getFieldValue(Object target, String fieldName) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        return (Set<T>) field.get(target);
    }
}
