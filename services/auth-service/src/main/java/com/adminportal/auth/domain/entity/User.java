package com.adminportal.auth.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Entity: User
 * Du lieu nguoi dung do BE tu thiet ke, KHONG dung Keycloak DB
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "is_2fa_enabled", nullable = false)
    private boolean twoFactorEnabled;

    @Column(name = "two_factor_secret", length = 255)
    private String twoFactorSecret;

    @Column(name = "reset_token", length = 255)
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private Instant resetTokenExpiry;

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {
    }

    private User(UUID id, String username, String email, String passwordHash,
                 String role, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = true;
        this.twoFactorEnabled = false;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    public static User create(String username, String email,
                              String passwordHash, String role) {
        return new User(UUID.randomUUID(), username, email,
                        passwordHash, role, Instant.now());
    }

    public boolean isActive() { return this.active; }

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
        this.passwordChangedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId()               { return id; }
    public String getUsername()       { return username; }
    public String getEmail()          { return email; }
    public String getPasswordHash()   { return passwordHash; }
    public String getRole()           { return role; }
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public String getTwoFactorSecret()   { return twoFactorSecret; }
    public String getResetToken()        { return resetToken; }
    public Instant getResetTokenExpiry() { return resetTokenExpiry; }
    public Instant getPasswordChangedAt(){ return passwordChangedAt; }
    public Instant getCreatedAt()     { return createdAt; }
    public Instant getUpdatedAt()     { return updatedAt; }
}
