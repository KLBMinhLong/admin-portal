package com.adminportal.auth.application.services;

import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class RuntimePermissionService {

    private final UserRepositoryPort userRepository;

    public RuntimePermissionService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public void ensureCurrentUserHasPermission(String permissionCode) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsernameWithRolesAndPermissions(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.getPermissionCodes().contains(permissionCode)) {
            throw new AccessDeniedException("Missing permission: " + permissionCode);
        }
    }

    @Transactional(readOnly = true)
    public Set<String> getPermissionCodes(String username) {
        User user = userRepository.findByUsernameWithRolesAndPermissions(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return user.getPermissionCodes();
    }

    @Transactional(readOnly = true)
    public Set<String> getAllAuthorities(String username) {
        User user = userRepository.findByUsernameWithRolesAndPermissions(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Set<String> authorities = user.getRoles().stream()
            .filter(com.adminportal.auth.domain.entity.Role::isActive)
            .map(r -> "ROLE_" + r.getCode().toUpperCase())
            .collect(java.util.stream.Collectors.toSet());

        authorities.addAll(user.getPermissionCodes());
        return authorities;
    }

    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Unauthenticated request");
        }
        return authentication.getName();
    }
}
