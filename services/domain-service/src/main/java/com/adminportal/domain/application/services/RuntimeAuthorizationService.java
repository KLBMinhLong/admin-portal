package com.adminportal.domain.application.services;

import com.adminportal.domain.application.port.out.UserAccessQueryPort;
import com.adminportal.domain.application.port.out.UserAccessQueryPort.UserAccessView;
import com.adminportal.domain.domain.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RuntimeAuthorizationService {

    private final UserAccessQueryPort userAccessQueryPort;

    public RuntimeAuthorizationService(UserAccessQueryPort userAccessQueryPort) {
        this.userAccessQueryPort = userAccessQueryPort;
    }

    @Transactional(readOnly = true)
    public UserAccessView getActiveUserAccess(String username) {
        return userAccessQueryPort.findActiveUserAccess(username)
            .orElseThrow(() -> new ResourceNotFoundException("Active user not found: " + username));
    }

    @Transactional(readOnly = true)
    public void ensureUserHasRole(String username, String requiredRole) {
        UserAccessView userAccess = getActiveUserAccess(username);
        if (!userAccess.roleCodes().contains(requiredRole)) {
            throw new AccessDeniedException("NOT_CURRENT_APPROVER");
        }
    }
}
