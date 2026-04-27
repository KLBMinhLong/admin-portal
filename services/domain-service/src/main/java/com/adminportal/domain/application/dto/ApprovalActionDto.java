package com.adminportal.domain.application.dto;

import jakarta.validation.constraints.NotBlank;

public record ApprovalActionDto(
    String comment
) {}
