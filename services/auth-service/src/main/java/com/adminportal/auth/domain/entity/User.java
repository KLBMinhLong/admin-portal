package com.adminportal.auth.domain.entity;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Entity: User
 * Du lieu nguoi dung do BE tu thiet ke, KHONG dung Keycloak DB
 */
public class User {

    private final UUID id;
    private String username;
    private String email;
    private String passwordHash;
    private String role;
    private String status;
    private boolean twoFactorEnabled;
    private String twoFactorSecret;
    private String resetToken;
    private Instant resetTokenExpiry;
    private final Instant createdAt;
    private Instant updatedAt;

    private User(UUID id, String username, String email, String passwordHash,
                 String role, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = "ACTIVE";
        this.twoFactorEnabled = false;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    public static User create(String username, String email,
                              String passwordHash, String role) {
        return new User(UUID.randomUUID(), username, email,
                        passwordHash, role, Instant.now());
    }

    public boolean isActive() { return "ACTIVE".equals(this.status); }

    public void enableTwoFactor(String secret) {
        this.twoFactorEnabled = true;
        this.twoFactorSecret = secret;
        this.updatedAt = Instant.now();
    }

    public void disableTwoFactor() {
        this.twoFactorEnabled = false;
        this.twoFactorSecret = null;
        this.updatedAt = Instant.now();
    }

    public void setResetToken(String token, Instant expiry) {
        this.resetToken = token;
        this.resetTokenExpiry = expiry;
        this.updatedAt = Instant.now();
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.resetToken = null;
        this.resetTokenExpiry = null;
        this.updatedAt = Instant.now();
    }

    public UUID getId()               { return id; }
    public String getUsername()       { return username; }
    public String getEmail()          { return email; }
    public String getPasswordHash()   { return passwordHash; }
    public String getRole()           { return role; }
    public String getStatus()         { return status; }
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public String getTwoFactorSecret()   { return twoFactorSecret; }
    public String getResetToken()        { return resetToken; }
    public Instant getResetTokenExpiry() { return resetTokenExpiry; }
    public Instant getCreatedAt()     { return createdAt; }
    public Instant getUpdatedAt()     { return updatedAt; }
}
