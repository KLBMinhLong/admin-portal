package com.adminportal.auth.application.dto.response;

import com.adminportal.auth.domain.entity.RbacAuditLog;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO cho danh sách nhật ký phân quyền hiển thị trên UI.
 * Thuộc tính khớp với frontend AdminAuditLog model.
 */
public record AdminAuditLogDto(
    UUID id,
    String actor,
    String action,
    String resource,
    String details,
    Instant timestamp
) {
    public static AdminAuditLogDto from(RbacAuditLog log) {
        return new AdminAuditLogDto(
            log.getId(), 
            log.getActorUsername(), 
            log.getAction(),
            log.getTargetType(), 
            log.getDetails(), 
            log.getCreatedAt()
        );
    }
}
