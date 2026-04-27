package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.request.AssignPermissionsRequest;
import com.adminportal.auth.application.dto.response.RolePermissionAssignmentResponse;

import java.util.UUID;

public interface AssignRolePermissionsUseCase {
    RolePermissionAssignmentResponse execute(UUID roleId, AssignPermissionsRequest request);
}
