package com.adminportal.auth.application.dto.response;

public record Toggle2faResponse(
    boolean enabled,
    String qrCodeImage // Base64 encoded image
) {}
