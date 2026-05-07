package com.adminportal.auth.infrastructure.scheduler;

import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class TokenCleanupScheduler {

    private final TokenRepositoryPort tokenRepositoryPort;

    public TokenCleanupScheduler(TokenRepositoryPort tokenRepositoryPort) {
        this.tokenRepositoryPort = tokenRepositoryPort;
    }

    /**
     * Tự động xóa các token không còn active mỗi ngày vào lúc 3 giờ sáng.
     * Cron expression: "0 0 3 * * *" (Second, Minute, Hour, Day of Month, Month, Day of Week)
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupInactiveTokens() {
        log.info("[Scheduler] Starting cleanup of inactive tokens...");
        try {
            tokenRepositoryPort.deleteAllInactive();
            log.info("[Scheduler] Successfully cleaned up inactive tokens.");
        } catch (Exception e) {
            log.error("[Scheduler] Error during inactive token cleanup: {}", e.getMessage(), e);
        }
    }
}
