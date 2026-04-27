package com.adminportal.domain.domain.event;

import java.time.Instant;

/**
 * Kafka event khi một purchasing request được xử lý phê duyệt (Approve/Reject).
 */
public record RequestProcessedEvent(
    Long requestId,
    String requestNumber,
    String processedBy,
    String action, // APPROVE or REJECT
    String comment,
    String finalStatus,
    Instant processedAt
) {}
