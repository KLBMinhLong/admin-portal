package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.RbacAuditLog;

public interface RbacAuditLogRepositoryPort {
    RbacAuditLog save(RbacAuditLog auditLog);
}
