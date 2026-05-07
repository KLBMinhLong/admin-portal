package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.AdminUserCreateRequest;
import com.adminportal.auth.application.dto.request.AdminUserRoleUpdateRequest;
import com.adminportal.auth.application.dto.request.AdminUserUpdateRequest;
import com.adminportal.auth.application.dto.response.AdminUserDto;
import com.adminportal.auth.application.dto.response.AdminUserRoleOptionDto;
import com.adminportal.auth.application.dto.response.ApiResponse;
import com.adminportal.auth.application.service.AdminUserManagementService;
import com.adminportal.auth.infrastructure.security.Encrypted;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Slf4j
public class AdminUserController {

    private final AdminUserManagementService service;

    public AdminUserController(AdminUserManagementService service) {
        this.service = service;
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> listUsers() {
        return ResponseEntity.ok(ApiResponse.ok(service.listUsers()));
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUser(@PathVariable("id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getUser(userId)));
    }

    @GetMapping("/roles/options")
    @PreAuthorize("hasAuthority('system.config') and (hasAuthority('user.manage') or hasAuthority('role.manage'))")
    public ResponseEntity<ApiResponse<List<AdminUserRoleOptionDto>>> listAssignableRoles() {
        return ResponseEntity.ok(ApiResponse.ok(service.listAssignableRoles()));
    }

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    @Encrypted
    public ResponseEntity<ApiResponse<AdminUserDto>> createUser(@Valid @RequestBody AdminUserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createUser(request)));
    }

    @PatchMapping("/users/{id}")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    @Encrypted
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUser(@PathVariable("id") UUID userId,
                                                                @Valid @RequestBody AdminUserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateUser(userId, request)));
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    @Encrypted
    public ResponseEntity<ApiResponse<AdminUserDto>> updateRole(@PathVariable("id") UUID userId,
                                                                @Valid @RequestBody AdminUserRoleUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateRole(userId, request)));
    }

    @PatchMapping("/users/{id}/toggle-active")
    @PreAuthorize("hasAuthority('system.config') and hasAuthority('user.manage')")
    public ResponseEntity<ApiResponse<AdminUserDto>> toggleActive(@PathVariable("id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(service.toggleActive(userId)));
    }
}
