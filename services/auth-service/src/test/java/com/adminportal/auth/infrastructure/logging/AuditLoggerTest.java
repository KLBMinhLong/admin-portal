package com.adminportal.auth.infrastructure.logging;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class AuditLoggerTest {

    @Test
    void testLogAudit() {
        AuditLogger auditLogger = new AuditLogger();
        assertDoesNotThrow(() -> {
            auditLogger.logAudit("admin", "login", "auth-service", "User logged in successfully");
        });
    }
}
