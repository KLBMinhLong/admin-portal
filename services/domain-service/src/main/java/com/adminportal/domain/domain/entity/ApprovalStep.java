package com.adminportal.domain.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "approval_steps", indexes = {
    @Index(name = "idx_app_step_request", columnList = "request_id")
})
public class ApprovalStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private PurchasingRequest request;

    @Column(name = "step_order", nullable = false)
    private int stepOrder;

    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;

    @Column(length = 50)
    private String approver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalStatus status;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ApprovalStep() { /* JPA */ }

    public ApprovalStep(int stepOrder, String roleName) {
        this.stepOrder = stepOrder;
        this.roleName = roleName;
        this.status = ApprovalStatus.PENDING;
    }

    void assignTo(PurchasingRequest request) {
        this.request = request;
    }

    public void approve(String approver, String comment) {
        this.approver = approver;
        this.comment = comment;
        this.status = ApprovalStatus.APPROVED;
        this.completedAt = Instant.now();
    }

    public void reject(String approver, String comment) {
        this.approver = approver;
        this.comment = comment;
        this.status = ApprovalStatus.REJECTED;
        this.completedAt = Instant.now();
    }

    // Getters
    public Long getId() { return id; }
    public PurchasingRequest getRequest() { return request; }
    public int getStepOrder() { return stepOrder; }
    public String getRoleName() { return roleName; }
    public String getApprover() { return approver; }
    public ApprovalStatus getStatus() { return status; }
    public String getComment() { return comment; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
