package com.adminportal.auth.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_]+$")
    String username,
    @NotBlank
    @Email
    String email,
    @NotBlank
    @Size(min = 12)
    String password,
    String firstName,
    String lastName
) {
}
