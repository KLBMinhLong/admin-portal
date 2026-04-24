package com.adminportal.auth.application.dto.request;
import jakarta.validation.constraints.NotBlank;
public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password,
    String totpCode,
    String deviceInfo
) {}
