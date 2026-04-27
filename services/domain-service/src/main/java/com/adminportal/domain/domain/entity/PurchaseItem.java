package com.adminportal.domain.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Line-item bên trong một PurchasingRequest.
 * total_price = quantity × unit_price (được tính tại factory).
 */
@Entity
@Table(name = "purchase_items", indexes = {
    @Index(name = "idx_pi_request", columnList = "request_id")
})
public class PurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_items_request"))
    private PurchasingRequest request;

    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalPrice;

    @Column(columnDefinition = "TEXT")
    private String specification;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PurchaseItem() { /* JPA */ }

    private PurchaseItem(String itemCode, String itemName, int quantity,
                         BigDecimal unitPrice, String specification) {
        this.itemCode = itemCode;
        this.itemName = itemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.specification = specification;
    }

    public static PurchaseItem create(String itemCode, String itemName,
                                      int quantity, BigDecimal unitPrice,
                                      String specification) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be > 0");
        }
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Unit price must be >= 0");
        }
        return new PurchaseItem(itemCode, itemName, quantity, unitPrice, specification);
    }

    /** Liên kết item với request cha (gọi bởi PurchasingRequest.addItem). */
    void assignTo(PurchasingRequest parent) {
        this.request = parent;
    }

    // ──────── Getters ────────
    public Long getId()               { return id; }
    public PurchasingRequest getRequest() { return request; }
    public String getItemCode()       { return itemCode; }
    public String getItemName()       { return itemName; }
    public int getQuantity()          { return quantity; }
    public BigDecimal getUnitPrice()  { return unitPrice; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public String getSpecification()  { return specification; }
    public Instant getCreatedAt()     { return createdAt; }
}
