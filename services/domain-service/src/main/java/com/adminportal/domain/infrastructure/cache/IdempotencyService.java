package com.adminportal.domain.infrastructure.cache;

import com.adminportal.domain.domain.entity.IdempotencyRecord;
import com.adminportal.domain.domain.exception.IdempotencyInProgressException;
import com.adminportal.domain.domain.exception.IdempotencyPayloadMismatchException;
import com.adminportal.domain.domain.repository.IdempotencyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

/**
 * UC-SEC-02: Kiểm soát Idempotency Key đầy đủ.
 *
 * Main Flow:
 *   1. Nhận Idempotency-Key
 *   2. Tra cứu record đã xử lý chưa
 *   3. Nếu đã có kết quả hợp lệ → trả lại kết quả cũ
 *   4. Nếu chưa có → lock key (status=PENDING)
 *   5. Thực thi business logic
 *   6. Lưu response snapshot + metadata (TTL 24h)
 *   7. Trả response mới
 *
 * Alternate Flows:
 *   A1: Thiếu key → 400 MISSING_IDEMPOTENCY_KEY (xử lý bởi @RequestHeader)
 *   A2: Key đang xử lý → 409 REQUEST_IN_PROGRESS
 *   A3: Lỗi trong xử lý → lưu trạng thái FAILED
 *
 * Edge Case:
 *   Cùng key nhưng payload khác → 409 IDEMPOTENCY_PAYLOAD_MISMATCH
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
     * Trả về response đã lưu nếu idempotency key đã tồn tại và còn hạn.
     * Kiểm tra thêm:
     *   - Nếu record đang PENDING → throw IdempotencyInProgressException (A2)
     *   - Nếu payload hash khác → throw IdempotencyPayloadMismatchException (Edge Case)
     *
     * @param idempotencyKey key cần tra cứu
     * @param payloadBody    body gốc (có thể null nếu không có body)
     * @return Optional chứa record đã hoàn thành, hoặc empty nếu chưa có
     */
    public Optional<IdempotencyRecord> findExisting(String idempotencyKey, String payloadBody) {
        Optional<IdempotencyRecord> optRecord = idempotencyRepository
            .findByIdempotencyKey(idempotencyKey)
            .filter(record -> record.getExpiresAt().isAfter(Instant.now()));

        if (optRecord.isEmpty()) {
            return Optional.empty();
        }

        IdempotencyRecord record = optRecord.get();

        // A2: Key đang xử lý bởi request khác
        if (record.isPending()) {
            throw new IdempotencyInProgressException(idempotencyKey);
        }

        // Edge Case: Cùng key nhưng payload khác
        if (record.getPayloadHash() != null && payloadBody != null) {
            String currentHash = hashPayload(payloadBody);
            if (!record.getPayloadHash().equals(currentHash)) {
                throw new IdempotencyPayloadMismatchException(idempotencyKey);
            }
        }

        // Record đã completed → replay
        return optRecord;
    }

    /**
     * Overload cho trường hợp không cần check payload hash (backward compat).
     */
    public Optional<IdempotencyRecord> findExisting(String idempotencyKey) {
        return findExisting(idempotencyKey, null);
    }

    /**
     * Lock idempotency key trước khi xử lý business logic.
     * Trả về record mới với status=PENDING.
     *
     * @return record đã lock, hoặc null nếu key đã tồn tại (race condition)
     */
    @Transactional
    public IdempotencyRecord lockKey(String idempotencyKey, String payloadBody) {
        String payloadHash = payloadBody != null ? hashPayload(payloadBody) : null;

        IdempotencyRecord record = new IdempotencyRecord(
            idempotencyKey,
            payloadHash,
            Instant.now().plus(TTL_HOURS, ChronoUnit.HOURS)
        );

        try {
            IdempotencyRecord saved = idempotencyRepository.save(record);
            log.debug("Locked idempotency key={}", idempotencyKey);
            return saved;
        } catch (DataIntegrityViolationException ex) {
            // Race condition: key đã được lock bởi request song song
            log.warn("Concurrent lock attempt for key={}", idempotencyKey);
            throw new IdempotencyInProgressException(idempotencyKey);
        }
    }

    /**
     * Đánh dấu key đã xử lý xong và lưu response.
     */
    @Transactional
    public void complete(String idempotencyKey, String responseJson, int httpStatus) {
        idempotencyRepository.findByIdempotencyKey(idempotencyKey)
            .ifPresent(record -> {
                record.complete(responseJson, httpStatus);
                idempotencyRepository.save(record);
                log.debug("Completed idempotency key={}", idempotencyKey);
            });
    }

    /**
     * Đánh dấu key xử lý thất bại.
     */
    @Transactional
    public void fail(String idempotencyKey) {
        idempotencyRepository.findByIdempotencyKey(idempotencyKey)
            .ifPresent(record -> {
                record.fail();
                idempotencyRepository.save(record);
                log.warn("Failed idempotency key={}", idempotencyKey);
            });
    }

    /**
     * Lưu kết quả mới cho idempotency key (one-shot, backward compat).
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

    /**
     * Cleanup scheduled job: xóa tất cả record hết hạn mỗi giờ.
     * UC-SEC-02 Acceptance Criteria: "Có cleanup record hết hạn."
     */
    @Scheduled(fixedRate = 3600000) // 1 giờ = 3,600,000ms
    @Transactional
    public void cleanupExpiredRecords() {
        int deleted = idempotencyRepository.deleteExpiredBefore(Instant.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired idempotency records", deleted);
        }
    }

    // ─── Private helpers ──────────────────────────────────────

    /**
     * Tạo SHA-256 hash từ payload body để so sánh.
     */
    private String hashPayload(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            // SHA-256 luôn có sẵn trong JVM
            throw new RuntimeException("SHA-256 not available", ex);
        }
    }
}
