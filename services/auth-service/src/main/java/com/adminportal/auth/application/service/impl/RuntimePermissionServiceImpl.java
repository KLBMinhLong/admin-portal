package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.RuntimePermissionService;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RuntimePermissionServiceImpl implements RuntimePermissionService {

    private final UserRepositoryPort userRepository;

    public RuntimePermissionServiceImpl(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public void ensureCurrentUserHasPermission(String permissionCode) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsernameWithRolesAndPermissions(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.getPermissionCodes().contains(permissionCode)) {
            log.warn("User {} missing permission: {}", username, permissionCode);
            throw new AccessDeniedException("Missing permission: " + permissionCode);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> getPermissionCodes(String username) {
        User user = userRepository.findByUsernameWithRolesAndPermissions(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return user.getPermissionCodes();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> getAllAuthorities(String username) {
        User user = userRepository.findByUsernameWithRolesAndPermissions(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Set<String> authorities = user.getRoles().stream()
            .filter(com.adminportal.auth.domain.entity.Role::isActive)
            .map(r -> "ROLE_" + r.getCode().toUpperCase())
            .collect(Collectors.toSet());

        authorities.addAll(user.getPermissionCodes());
        log.debug("Resolved {} authorities for username={}", authorities.size(), username);
        return authorities;
    }

    @Override
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Unauthenticated request");
        }
        return authentication.getName();
    }
}
