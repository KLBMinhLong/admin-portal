package com.adminportal.auth.application.service;

import java.util.Set;

public interface RuntimePermissionService {
    void ensureCurrentUserHasPermission(String permissionCode);
    Set<String> getPermissionCodes(String username);
    Set<String> getAllAuthorities(String username);
    String getCurrentUsername();
}
