package com.adminportal.domain.infrastructure.logging;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.ThreadContext;
import org.springframework.stereotype.Component;

@Component
public class AuditLogger {
    private static final Logger AUDIT = LogManager.getLogger("AuditLogger");

    public void logAudit(String actor, String action, String resource, String details) {
        ThreadContext.put("audit", "true");
        ThreadContext.put("actor", actor);
        ThreadContext.put("action", action);
        ThreadContext.put("resource", resource);
        
        AUDIT.info("AUDIT: Actor=[{}] Action=[{}] Resource=[{}] Details=[{}]", actor, action, resource, details);
        
        ThreadContext.remove("audit");
        ThreadContext.remove("actor");
        ThreadContext.remove("action");
        ThreadContext.remove("resource");
    }
}
