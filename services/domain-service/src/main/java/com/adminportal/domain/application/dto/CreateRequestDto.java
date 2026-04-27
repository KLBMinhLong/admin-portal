package com.adminportal.domain.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

/**
 * DTO tạo mới purchasing request.
 * Validate: ít nhất 1 item, title bắt buộc.
 */
public record CreateRequestDto(

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be ≤ 200 characters")
    String title,

    @Size(max = 2000, message = "Description must be ≤ 2000 characters")
    String description,

    Long departmentId,

    @Size(max = 50)
    String costCenter,

    @Size(max = 3, message = "Currency code must be ≤ 3 characters")
    String currency,

    @NotEmpty(message = "At least one item is required")
    @Valid
    List<PurchaseItemDto> items
) {}
