package com.adminportal.domain.infrastructure.cache;

import com.adminportal.domain.domain.entity.IdempotencyRecord;
import com.adminportal.domain.domain.repository.IdempotencyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Idempotency service — kiểm tra idempotency key trùng và lưu kết quả.
 * Rule 13: All POST/PUT/PATCH endpoints must have idempotency key.
 */
@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);
    private static final long TTL_HOURS = 24;

    private final IdempotencyRepository idempotencyRepository;

    public IdempotencyService(IdempotencyRepository idempotencyRepository) {
        this.idempotencyRepository = idempotencyRepository;
    }

    /**
     * Trả về response đã lưu nếu idempotency key đã tồn tại.
     */
    public Optional<IdempotencyRecord> findExisting(String idempotencyKey) {
        return idempotencyRepository.findByIdempotencyKey(idempotencyKey)
            .filter(record -> record.getExpiresAt().isAfter(Instant.now()));
    }

    /**
     * Lưu kết quả mới cho idempotency key.
     */
    public void save(String idempotencyKey, String responseJson, int httpStatus) {
        IdempotencyRecord record = new IdempotencyRecord(
            idempotencyKey,
            responseJson,
            httpStatus,
            Instant.now().plus(TTL_HOURS, ChronoUnit.HOURS)
        );
        idempotencyRepository.save(record);
        log.debug("Saved idempotency record key={}", idempotencyKey);
    }
}
