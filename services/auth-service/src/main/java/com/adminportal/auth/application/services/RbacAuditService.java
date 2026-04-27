package com.adminportal.auth.application.services;

import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.domain.entity.RbacAuditLog;
import org.springframework.stereotype.Service;

@Service
public class RbacAuditService {

    private final RbacAuditLogRepositoryPort auditLogRepository;

    public RbacAuditService(RbacAuditLogRepositoryPort auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String actorUsername, String action, String targetType, String targetId, String details) {
        auditLogRepository.save(RbacAuditLog.record(actorUsername, action, targetType, targetId, details));
    }
}
