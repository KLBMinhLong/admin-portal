package com.adminportal.domain.application.port.out;

import com.adminportal.domain.domain.entity.IdempotencyRecord;

import java.time.Instant;
import java.util.Optional;

public interface IdempotencyPort {
    Optional<IdempotencyRecord> findByIdempotencyKey(String key);
    IdempotencyRecord save(IdempotencyRecord record);
    int deleteExpiredBefore(Instant now);
}
