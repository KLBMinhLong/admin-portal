package com.adminportal.auth.application.util;

import com.adminportal.auth.domain.exception.InvalidInputException;

import java.util.Locale;

public final class DataNormalizer {

    private DataNormalizer() {}

    public static String normalizeUsername(String username) {
        return normalizeRequired(username).toLowerCase(Locale.ROOT);
    }

    public static String normalizeEmail(String email) {
        return normalizeRequired(email).toLowerCase(Locale.ROOT);
    }

    public static String normalizeRoleCode(String roleCode) {
        String normalized = normalizeRequired(roleCode).toUpperCase(Locale.ROOT);
        return normalized.startsWith("ROLE_") ? normalized.substring(5) : normalized;
    }

    public static String normalizeRequired(String value) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException("Giá trị bắt buộc không được để trống");
        }
        return value.trim();
    }

    public static String normalizeName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
