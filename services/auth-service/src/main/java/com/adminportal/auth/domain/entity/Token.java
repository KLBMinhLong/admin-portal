package com.adminportal.auth.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Entity: Token
 * - Token khong het han (never-expire) - revoke bang flag active=false
 * - 1 phien dang nhap duy nhat per user
 * - Chi chua username + role (khong co permission - dinh danh thoi)
 */
@Entity
@Table(name = "auth_tokens", indexes = {
    @Index(name = "idx_auth_tokens_user_active", columnList = "user_id,is_active"),
    @Index(name = "idx_auth_tokens_jti", columnList = "token_jti", unique = true)
})
public class Token {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_jti", nullable = false, unique = true, length = 255)
    private String tokenJti;

    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected Token() {
    }

    private Token(UUID id, UUID userId, String tokenJti, String tokenHash,
                  Instant issuedAt, String ipAddress, String userAgent) {
        this.id = id;
        this.userId = userId;
        this.tokenJti = tokenJti;
        this.tokenHash = tokenHash;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.active = true;
        this.issuedAt = issuedAt;
        this.expiresAt = null;
    }

    public static Token issue(UUID userId, String tokenJti,
                              String tokenHash, Instant issuedAt,
                              String ipAddress, String userAgent) {
        return new Token(UUID.randomUUID(), userId, tokenJti, tokenHash,
            issuedAt, ipAddress, userAgent);
    }

    public static Token cached(String tokenJti) {
        return new Token(null, null, tokenJti, "", Instant.now(), null, null);
    }

    /** Cam co token khong con hoat dong (dang xuat / dang nhap thiet bi khac) */
    public void revoke() {
        if (!this.active) throw new IllegalStateException("Token already revoked: " + this.id);
        this.active = false;
        this.revokedAt = Instant.now();
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (issuedAt == null) {
            issuedAt = Instant.now();
        }
    }

    public UUID getId()         { return id; }
    public UUID getUserId()     { return userId; }
    public String getTokenJti() { return tokenJti; }
    public String getTokenHash(){ return tokenHash; }
    public String getIpAddress(){ return ipAddress; }
    public String getUserAgent(){ return userAgent; }
    public boolean isActive()   { return active; }
    public Instant getIssuedAt(){ return issuedAt; }
    public Instant getExpiresAt(){ return expiresAt; }
    public Instant getRevokedAt(){ return revokedAt; }
}
