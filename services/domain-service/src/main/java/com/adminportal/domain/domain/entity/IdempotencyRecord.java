package com.adminportal.domain.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Lưu kết quả của mỗi idempotency key để ngăn xử lý trùng lặp.
 */
@Entity
@Table(name = "idempotency_records", indexes = {
    @Index(name = "idx_idem_key", columnList = "idempotency_key", unique = true)
})
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "http_status", nullable = false)
    private int httpStatus;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected IdempotencyRecord() { /* JPA */ }

    public IdempotencyRecord(String idempotencyKey, String responseBody,
                             int httpStatus, Instant expiresAt) {
        this.idempotencyKey = idempotencyKey;
        this.responseBody = responseBody;
        this.httpStatus = httpStatus;
        this.expiresAt = expiresAt;
    }

    public Long getId()               { return id; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getResponseBody()   { return responseBody; }
    public int getHttpStatus()        { return httpStatus; }
    public Instant getCreatedAt()     { return createdAt; }
    public Instant getExpiresAt()     { return expiresAt; }
}
