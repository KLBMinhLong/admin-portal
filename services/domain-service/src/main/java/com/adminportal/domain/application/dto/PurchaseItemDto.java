package com.adminportal.domain.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * DTO cho một line-item trong request tạo mới.
 */
public record PurchaseItemDto(

    @Size(max = 50)
    String itemCode,

    @NotBlank(message = "Item name is required")
    @Size(max = 200)
    String itemName,

    @Min(value = 1, message = "Quantity must be ≥ 1")
    int quantity,

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be ≥ 0")
    BigDecimal unitPrice,

    @Size(max = 2000)
    String specification
) {}
