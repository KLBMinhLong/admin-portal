package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.request.AssignRolesRequest;
import com.adminportal.auth.application.dto.response.UserRoleAssignmentResponse;

import java.util.UUID;

public interface AssignUserRolesUseCase {
    UserRoleAssignmentResponse execute(UUID userId, AssignRolesRequest request);
}
