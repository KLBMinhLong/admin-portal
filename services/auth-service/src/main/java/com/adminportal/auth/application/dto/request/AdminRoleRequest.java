package com.adminportal.auth.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRoleRequest(
    @NotBlank(message = "Mã Role không được để trống")
    @Size(max = 50)
    String code,

    @NotBlank(message = "Tên Role không được để trống")
    @Size(max = 100)
    String name,

    String description
) {}
