package com.adminportal.domain.domain.event;

import java.time.Instant;

/**
 * Kafka event khi một purchasing request được submit.
 */
public record RequestSubmittedEvent(
    Long requestId,
    String requestNumber,
    String submittedBy,
    String status,
    Instant submittedAt
) {}
