package com.adminportal.domain.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO cho một purchasing request đã tạo.
 */
public record PurchasingRequestDto(
    Long id,
    String requestNumber,
    String title,
    String description,
    String requestedBy,
    LocalDate requestedDate,
    String status,
    BigDecimal totalAmount,
    String currency,
    Long departmentId,
    String costCenter,
    List<PurchaseItemResponseDto> items,
    Instant createdAt,
    String createdBy
) {
    public record PurchaseItemResponseDto(
        Long id,
        String itemCode,
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        String specification
    ) {}
}
