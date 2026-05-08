package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.port.out.AuditLoggerPort;
import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.application.service.RbacAuditService;
import com.adminportal.auth.domain.entity.RbacAuditLog;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RbacAuditServiceImpl implements RbacAuditService {

    private static final Logger log = LoggerFactory.getLogger(RbacAuditServiceImpl.class);

    private final RbacAuditLogRepositoryPort auditLogRepository;
    private final AuditLoggerPort auditLogger;

    public RbacAuditServiceImpl(RbacAuditLogRepositoryPort auditLogRepository, AuditLoggerPort auditLogger) {
        this.auditLogRepository = auditLogRepository;
        this.auditLogger = auditLogger;
    }

    @Override
    public void record(String actorUsername, String action, String targetType, String targetId, String details) {
        auditLogRepository.save(RbacAuditLog.record(actorUsername, action, targetType, targetId, details));
        auditLogger.logAudit(actorUsername, action, targetType + ":" + targetId, details);
        log.info("RBAC audit: actor={} action={} target={}:{}", actorUsername, action, targetType, targetId);
    }
}
