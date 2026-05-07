package com.adminportal.auth.application.port.out;

public interface AuditLoggerPort {
    void logAudit(String actor, String action, String resource, String details);
}
