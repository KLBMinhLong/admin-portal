package com.adminportal.auth.application.dto.response;

import com.adminportal.auth.domain.entity.RbacAuditLog;
import java.time.Instant;
import java.util.UUID;

public record AdminAuditLogDto(
    UUID id,
    String actorUsername,
    String action,
    String targetType,
    String targetId,
    String details,
    Instant createdAt
) {
    public static AdminAuditLogDto from(RbacAuditLog log) {
        return new AdminAuditLogDto(
            log.getId(), log.getActorUsername(), log.getAction(),
            log.getTargetType(), log.getTargetId(), log.getDetails(), log.getCreatedAt()
        );
    }
}
