package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.domain.entity.RbacAuditLog;
import org.springframework.stereotype.Repository;

@Repository
public class RbacAuditLogRepositoryAdapter implements RbacAuditLogRepositoryPort {

    private final SpringDataRbacAuditLogRepository repository;

    public RbacAuditLogRepositoryAdapter(SpringDataRbacAuditLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public RbacAuditLog save(RbacAuditLog auditLog) {
        return repository.save(auditLog);
    }
}
