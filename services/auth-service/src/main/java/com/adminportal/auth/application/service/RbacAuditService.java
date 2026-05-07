package com.adminportal.auth.application.service;

public interface RbacAuditService {
    void record(String actorUsername, String action, String targetType, String targetId, String details);
}
