package com.adminportal.domain.domain.entity;

import jakarta.persistence.*;
import com.adminportal.domain.domain.exception.BusinessStateException;
import com.adminportal.domain.domain.exception.DomainConflictException;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Aggregate root – Purchasing Request.
 * Chứa danh sách PurchaseItem và tự tính tổng tiền.
 */
@Entity
@Table(name = "purchasing_requests", indexes = {
    @Index(name = "idx_pr_status", columnList = "status"),
    @Index(name = "idx_pr_requested_by", columnList = "requested_by"),
    @Index(name = "idx_pr_request_number", columnList = "request_number", unique = true)
})
public class PurchasingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_number", nullable = false, unique = true, length = 20)
    private String requestNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "requested_by", nullable = false, length = 50)
    private String requestedBy;

    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RequestStatus status;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "cost_center", length = 50)
    private String costCenter;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApprovalStep> approvalSteps = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    protected PurchasingRequest() { /* JPA */ }

    private PurchasingRequest(String requestNumber, String title, String description,
                              String requestedBy, Long departmentId, String costCenter,
                              String currency) {
        this.requestNumber = requestNumber;
        this.title = title;
        this.description = description;
        this.requestedBy = requestedBy;
        this.requestedDate = LocalDate.now();
        this.status = RequestStatus.DRAFT;
        this.totalAmount = BigDecimal.ZERO;
        this.currency = currency;
        this.departmentId = departmentId;
        this.costCenter = costCenter;
        this.createdBy = requestedBy;
        this.updatedBy = requestedBy;
    }

    // ──────── Factory ────────

    public static PurchasingRequest create(String requestNumber, String title, String description,
                                           String requestedBy, Long departmentId,
                                           String costCenter, String currency) {
        return new PurchasingRequest(requestNumber, title, description,
                                    requestedBy, departmentId, costCenter, currency);
    }

    @Version
    @Column(name = "version")
    private Long version;

    // ──────── Domain behaviour ────────

    /**
     * Submit request: kiểm tra điều kiện và chuyển sang trạng thái PENDING_APPROVAL.
     */
    public void submit() {
        if (this.status != RequestStatus.DRAFT) {
            throw new BusinessStateException("INVALID_STATUS_TRANSITION");
        }
        if (this.items.isEmpty()) {
            throw new BusinessStateException("REQUEST_ITEMS_REQUIRED");
        }
        
        // Step 1 luôn là Department Lead
        addApprovalStep(new ApprovalStep(1, "DEPARTMENT_LEAD"));
        
        // Step 2: Finance Manager chỉ cần khi số tiền >= 50,000,000 VND
        if (this.totalAmount.compareTo(new java.math.BigDecimal("50000000")) >= 0) {
            addApprovalStep(new ApprovalStep(2, "FINANCE_MANAGER"));
        }
        
        this.status = RequestStatus.PENDING_APPROVAL;
    }

    private void addApprovalStep(ApprovalStep step) {
        step.assignTo(this);
        this.approvalSteps.add(step);
    }

    public ApprovalStep getCurrentPendingStep() {
        return this.approvalSteps.stream()
                .filter(step -> step.getStatus() == ApprovalStatus.PENDING)
                .min(java.util.Comparator.comparingInt(ApprovalStep::getStepOrder))
                .orElseThrow(() -> new DomainConflictException("STEP_ALREADY_PROCESSED"));
    }

    public void processApproval(String username, String comment, boolean isApproved) {
        if (this.status != RequestStatus.PENDING_APPROVAL) {
            throw new BusinessStateException("INVALID_REQUEST_STATE");
        }

        ApprovalStep currentStep = getCurrentPendingStep();
        
        if (isApproved) {
            currentStep.approve(username, comment);
            // Kiểm tra xem còn step pending nào không
            boolean hasMoreSteps = this.approvalSteps.stream()
                    .anyMatch(step -> step.getStatus() == ApprovalStatus.PENDING);
            if (!hasMoreSteps) {
                this.status = RequestStatus.APPROVED;
            }
        } else {
            if (comment == null || comment.trim().isEmpty()) {
                throw new IllegalArgumentException("Rejecting a request requires a comment/remark");
            }
            currentStep.reject(username, comment);
            this.status = RequestStatus.REJECTED;
        }
    }

    /**
     * Thêm item vào request và cập nhật tổng tiền.
     */
    public void addItem(PurchaseItem item) {
        item.assignTo(this);
        this.items.add(item);
        recalculateTotal();
    }

    /**
     * Tính lại tổng tiền dựa trên danh sách item.
     */
    public void recalculateTotal() {
        this.totalAmount = items.stream()
            .map(PurchaseItem::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ──────── Getters ────────
    public Long getId()                  { return id; }
    public String getRequestNumber()     { return requestNumber; }
    public String getTitle()             { return title; }
    public String getDescription()       { return description; }
    public String getRequestedBy()       { return requestedBy; }
    public LocalDate getRequestedDate()  { return requestedDate; }
    public RequestStatus getStatus()     { return status; }
    public BigDecimal getTotalAmount()   { return totalAmount; }
    public String getCurrency()          { return currency; }
    public Long getDepartmentId()        { return departmentId; }
    public String getCostCenter()        { return costCenter; }
    public List<PurchaseItem> getItems() { return items; }
    public Instant getCreatedAt()        { return createdAt; }
    public Instant getUpdatedAt()        { return updatedAt; }
    public String getCreatedBy()         { return createdBy; }
    public String getUpdatedBy()         { return updatedBy; }
    public List<ApprovalStep> getApprovalSteps() { return approvalSteps; }
}
