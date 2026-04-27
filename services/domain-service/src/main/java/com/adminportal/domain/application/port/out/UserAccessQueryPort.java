package com.adminportal.domain.application.port.out;

import java.util.Optional;
import java.util.Set;

public interface UserAccessQueryPort {

    Optional<UserAccessView> findActiveUserAccess(String username);

    record UserAccessView(
        String userId,
        String username,
        Set<String> roleCodes,
        Set<String> permissionCodes
    ) {
    }
}
