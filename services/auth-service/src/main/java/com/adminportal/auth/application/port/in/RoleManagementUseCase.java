package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.request.AdminRoleRequest;
import com.adminportal.auth.application.dto.response.AdminAuditLogDto;
import com.adminportal.auth.application.dto.response.AdminPermissionDto;
import com.adminportal.auth.application.dto.response.AdminRoleDto;

import java.util.List;
import java.util.UUID;

public interface RoleManagementUseCase {
    AdminRoleDto createRole(AdminRoleRequest request);
    AdminRoleDto updateRole(UUID roleId, AdminRoleRequest request);
    AdminRoleDto toggleRoleActive(UUID roleId);
    List<AdminRoleDto> listRoles();
    List<AdminPermissionDto> listPermissions();
    List<AdminAuditLogDto> listAuditLogs();
}
