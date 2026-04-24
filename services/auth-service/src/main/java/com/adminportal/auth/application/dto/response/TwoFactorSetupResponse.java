package com.adminportal.auth.application.dto.response;
public record TwoFactorSetupResponse(String secret, String qrCodeUrl, String backupCodes) {}
