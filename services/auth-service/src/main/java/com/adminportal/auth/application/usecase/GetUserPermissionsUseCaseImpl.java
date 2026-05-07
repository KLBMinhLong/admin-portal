package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.response.UserPermissionsResponse;
import com.adminportal.auth.application.port.in.GetUserPermissionsUseCase;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.RuntimePermissionService;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GetUserPermissionsUseCaseImpl implements GetUserPermissionsUseCase {

    private static final String REQUIRED_PERMISSION = "system.config";

    private final UserRepositoryPort userRepository;
    private final RuntimePermissionService runtimePermissionService;

    public GetUserPermissionsUseCaseImpl(UserRepositoryPort userRepository,
                                         RuntimePermissionService runtimePermissionService) {
        this.userRepository = userRepository;
        this.runtimePermissionService = runtimePermissionService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserPermissionsResponse execute(UUID userId) {
        runtimePermissionService.ensureCurrentUserHasPermission(REQUIRED_PERMISSION);

        var user = userRepository.findByIdWithRolesAndPermissions(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return new UserPermissionsResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getRoles().stream()
                .map(Role::getCode)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toCollection(LinkedHashSet::new)),
            user.getPermissionCodes().stream()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toCollection(LinkedHashSet::new))
        );
    }
}
