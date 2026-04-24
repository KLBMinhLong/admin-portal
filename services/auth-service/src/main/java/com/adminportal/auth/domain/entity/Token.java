package com.adminportal.auth.domain.entity;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Entity: Token
 * - Token khong het han (never-expire) - revoke bang flag active=false
 * - 1 phien dang nhap duy nhat per user
 * - Chi chua username + role (khong co permission - dinh danh thoi)
 */
public class Token {

    private final UUID id;
    private final UUID userId;
    private final String username;
    private final String role;
    private final String tokenValue;
    private boolean active;
    private final Instant createdAt;
    private Instant revokedAt;
    private final String deviceInfo;

    private Token(UUID id, UUID userId, String username, String role,
                  String tokenValue, Instant createdAt, String deviceInfo) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.tokenValue = tokenValue;
        this.active = true;
        this.createdAt = createdAt;
        this.deviceInfo = deviceInfo;
    }

    public static Token create(UUID userId, String username,
                               String role, String tokenValue, String deviceInfo) {
        return new Token(UUID.randomUUID(), userId, username, role,
                         tokenValue, Instant.now(), deviceInfo);
    }

    /** Cam co token khong con hoat dong (dang xuat / dang nhap thiet bi khac) */
    public void revoke() {
        if (!this.active) throw new IllegalStateException("Token already revoked: " + this.id);
        this.active = false;
        this.revokedAt = Instant.now();
    }

    public UUID getId()           { return id; }
    public UUID getUserId()       { return userId; }
    public String getUsername()   { return username; }
    public String getRole()       { return role; }
    public String getTokenValue() { return tokenValue; }
    public boolean isActive()     { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public String getDeviceInfo() { return deviceInfo; }
}
