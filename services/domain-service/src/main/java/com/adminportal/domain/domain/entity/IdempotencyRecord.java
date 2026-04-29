package com.adminportal.domain.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Lưu kết quả của mỗi idempotency key để ngăn xử lý trùng lặp.
 * UC-SEC-02: Bao gồm payload hash để phát hiện payload mismatch,
 *            và status để phát hiện request đang xử lý dở.
 */
@Entity
@Table(name = "idempotency_records", indexes = {
    @Index(name = "idx_idem_key", columnList = "idempotency_key", unique = true),
    @Index(name = "idx_idem_expires", columnList = "expires_at"),
    @Index(name = "idx_idem_status", columnList = "status")
})
public class IdempotencyRecord {

    public enum Status {
        /** Key đã được lock, đang xử lý business logic */
        PENDING,
        /** Xử lý xong, response đã lưu */
        COMPLETED,
        /** Xử lý thất bại */
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "http_status", nullable = false)
    private int httpStatus;

    /**
     * SHA-256 hash của payload gốc.
     * Dùng để phát hiện cùng key nhưng payload khác → 409 IDEMPOTENCY_PAYLOAD_MISMATCH.
     */
    @Column(name = "payload_hash", length = 64)
    private String payloadHash;

    /**
     * Trạng thái xử lý: PENDING / COMPLETED / FAILED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.COMPLETED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected IdempotencyRecord() { /* JPA */ }

    /** Constructor cho trường hợp lock (PENDING) – chưa có response */
    public IdempotencyRecord(String idempotencyKey, String payloadHash, Instant expiresAt) {
        this.idempotencyKey = idempotencyKey;
        this.payloadHash = payloadHash;
        this.httpStatus = 0;
        this.status = Status.PENDING;
        this.expiresAt = expiresAt;
    }

    /** Constructor cho trường hợp lưu kết quả (COMPLETED) */
    public IdempotencyRecord(String idempotencyKey, String responseBody,
                             int httpStatus, Instant expiresAt) {
        this.idempotencyKey = idempotencyKey;
        this.responseBody = responseBody;
        this.httpStatus = httpStatus;
        this.status = Status.COMPLETED;
        this.expiresAt = expiresAt;
    }

    /** Đánh dấu xử lý thành công và lưu response */
    public void complete(String responseBody, int httpStatus) {
        this.responseBody = responseBody;
        this.httpStatus = httpStatus;
        this.status = Status.COMPLETED;
    }

    /** Đánh dấu xử lý thất bại */
    public void fail() {
        this.status = Status.FAILED;
    }

    // ─── Getters ──────────────────────────────────────────────

    public Long getId()               { return id; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getResponseBody()   { return responseBody; }
    public int getHttpStatus()        { return httpStatus; }
    public String getPayloadHash()    { return payloadHash; }
    public Status getStatus()         { return status; }
    public Instant getCreatedAt()     { return createdAt; }
    public Instant getExpiresAt()     { return expiresAt; }

    public boolean isPending()        { return status == Status.PENDING; }
    public boolean isCompleted()      { return status == Status.COMPLETED; }
}
