package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.response.UserPermissionsResponse;

import java.util.UUID;

public interface GetUserPermissionsUseCase {
    UserPermissionsResponse execute(UUID userId);
}
