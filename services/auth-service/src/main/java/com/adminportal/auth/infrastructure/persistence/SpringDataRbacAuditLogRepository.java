package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.domain.entity.RbacAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface SpringDataRbacAuditLogRepository extends JpaRepository<RbacAuditLog, UUID> {
}
