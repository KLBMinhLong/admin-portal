package com.adminportal.auth.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminUserUpdateRequest(
    @NotBlank
    @Email
    String email,
    String firstName,
    String lastName
) {
}
