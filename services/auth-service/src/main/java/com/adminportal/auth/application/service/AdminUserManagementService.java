package com.adminportal.auth.application.service;

import com.adminportal.auth.application.dto.request.AdminUserCreateRequest;
import com.adminportal.auth.application.dto.request.AdminUserRoleUpdateRequest;
import com.adminportal.auth.application.dto.request.AdminUserUpdateRequest;
import com.adminportal.auth.application.dto.response.AdminUserDto;
import com.adminportal.auth.application.dto.response.AdminUserRoleOptionDto;

import java.util.List;
import java.util.UUID;

public interface AdminUserManagementService {
    List<AdminUserDto> listUsers();
    AdminUserDto getUser(UUID userId);
    List<AdminUserRoleOptionDto> listAssignableRoles();
    AdminUserDto createUser(AdminUserCreateRequest request);
    AdminUserDto updateUser(UUID userId, AdminUserUpdateRequest request);
    AdminUserDto updateRole(UUID userId, AdminUserRoleUpdateRequest request);
    AdminUserDto toggleActive(UUID userId);
}
