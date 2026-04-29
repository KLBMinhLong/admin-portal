package com.adminportal.auth.application.port.out;

import com.adminportal.auth.domain.entity.RbacAuditLog;

import java.util.List;

public interface RbacAuditLogRepositoryPort {
    RbacAuditLog save(RbacAuditLog auditLog);
    List<RbacAuditLog> findTop50ByOrderByCreatedAtDesc();
}
