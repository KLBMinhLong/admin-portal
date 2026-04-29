package com.adminportal.auth.application.dto.response;

import com.adminportal.auth.domain.entity.User;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DTO for Admin User Management list/detail.
 * Không bao giờ expose passwordHash ra ngoài.
 */
public record AdminUserDto(
    UUID id,
    String username,
    String email,
    String role,
    String firstName,
    String lastName,
    boolean active,
    boolean emailVerified,
    boolean twoFactorEnabled,
    Set<String> roles,
    Instant createdAt,
    Instant updatedAt
) {
    public static AdminUserDto from(User user) {
        return new AdminUserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole(),
            user.getFirstName(),
            user.getLastName(),
            user.isActive(),
            user.isEmailVerified(),
            user.isTwoFactorEnabled(),
            user.getRoles().stream()
                .map(r -> r.getCode())
                .collect(Collectors.toSet()),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
