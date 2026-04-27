package com.adminportal.domain.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Kafka event khi một purchasing request được tạo.
 */
public record RequestCreatedEvent(
    Long requestId,
    String requestNumber,
    String requestedBy,
    BigDecimal totalAmount,
    String currency,
    String status,
    Instant createdAt
) {}
