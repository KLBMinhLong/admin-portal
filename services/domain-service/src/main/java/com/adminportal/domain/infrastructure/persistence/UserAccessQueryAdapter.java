package com.adminportal.domain.infrastructure.persistence;

import com.adminportal.domain.application.port.out.UserAccessQueryPort;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Repository
public class UserAccessQueryAdapter implements UserAccessQueryPort {

    private final EntityManager entityManager;

    public UserAccessQueryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Optional<UserAccessView> findActiveUserAccess(String username) {
        List<Object[]> users = entityManager.createNativeQuery("""
                SELECT CAST(u.id AS TEXT), u.username
                FROM auth.users u
                WHERE u.username = :username
                  AND u.is_active = TRUE
                """)
            .setParameter("username", normalizeUsername(username))
            .getResultList();

        if (users.isEmpty()) {
            return Optional.empty();
        }

        Object[] row = users.getFirst();
        String userId = (String) row[0];
        String normalizedUsername = (String) row[1];

        Set<String> roleCodes = new LinkedHashSet<>(entityManager.createNativeQuery("""
                SELECT DISTINCT r.code
                FROM auth.roles r
                JOIN auth.user_roles ur ON ur.role_id = r.id
                JOIN auth.users u ON u.id = ur.user_id
                WHERE u.username = :username
                  AND u.is_active = TRUE
                  AND r.is_active = TRUE
                ORDER BY r.code
                """)
            .setParameter("username", normalizedUsername)
            .getResultList());

        Set<String> permissionCodes = new LinkedHashSet<>(entityManager.createNativeQuery("""
                SELECT DISTINCT p.code
                FROM auth.permissions p
                JOIN auth.role_permissions rp ON rp.permission_id = p.id
                JOIN auth.user_roles ur ON ur.role_id = rp.role_id
                JOIN auth.users u ON u.id = ur.user_id
                JOIN auth.roles r ON r.id = ur.role_id
                WHERE u.username = :username
                  AND u.is_active = TRUE
                  AND r.is_active = TRUE
                  AND p.is_active = TRUE
                ORDER BY p.code
                """)
            .setParameter("username", normalizedUsername)
            .getResultList());

        return Optional.of(new UserAccessView(userId, normalizedUsername, roleCodes, permissionCodes));
    }

    private String normalizeUsername(String username) {
        return username == null ? null : username.trim().toLowerCase(Locale.ROOT);
    }
}
