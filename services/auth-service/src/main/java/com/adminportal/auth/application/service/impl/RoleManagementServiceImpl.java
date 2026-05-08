package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.dto.request.AdminRoleRequest;
import com.adminportal.auth.application.dto.response.AdminAuditLogDto;
import com.adminportal.auth.application.dto.response.AdminPermissionDto;
import com.adminportal.auth.application.dto.response.AdminRoleDto;
import com.adminportal.auth.application.port.out.PermissionRepositoryPort;
import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.service.RbacAuditService;
import com.adminportal.auth.application.service.RoleManagementService;
import com.adminportal.auth.application.service.RuntimePermissionService;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.exception.BusinessStateException;
import com.adminportal.auth.domain.exception.ResourceConflictException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RoleManagementServiceImpl implements RoleManagementService {

    private static final Logger log = LoggerFactory.getLogger(RoleManagementServiceImpl.class);

    private final RoleRepositoryPort roleRepository;
    private final PermissionRepositoryPort permissionRepository;
    private final RbacAuditLogRepositoryPort auditLogRepository;
    private final RbacAuditService auditService;
    private final RuntimePermissionService runtimePermissionService;

    public RoleManagementServiceImpl(RoleRepositoryPort roleRepository,
            PermissionRepositoryPort permissionRepository,
            RbacAuditLogRepositoryPort auditLogRepository,
            RbacAuditService auditService,
            RuntimePermissionService runtimePermissionService) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
        this.runtimePermissionService = runtimePermissionService;
    }

    @Override
    public AdminRoleDto createRole(AdminRoleRequest request) {
        if (roleRepository.findByCode(request.code()).isPresent()) {
            throw new ResourceConflictException("Mã Role đã tồn tại: " + request.code());
        }

        Role role = Role.create(request.code(), request.name(), request.description());
        Role savedRole = roleRepository.save(role);
        log.info("Created role code={}", request.code());

        String actor = runtimePermissionService.getCurrentUsername();
        auditService.record(actor != null ? actor : "SYSTEM", "ROLE_CREATED", "ROLE", savedRole.getId().toString(),
                "Created role: " + savedRole.getCode() + " (" + savedRole.getName() + ")");

        return AdminRoleDto.from(savedRole);
    }

    @Override
    public AdminRoleDto updateRole(UUID roleId, AdminRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + roleId));

        role.updateInfo(request.name(), request.description());
        Role savedRole = roleRepository.save(role);
        log.info("Updated role roleId={}", roleId);

        String actor = runtimePermissionService.getCurrentUsername();
        auditService.record(actor != null ? actor : "SYSTEM", "ROLE_UPDATED", "ROLE", savedRole.getId().toString(),
                "Updated role: " + savedRole.getCode() + ". New Name: " + savedRole.getName());

        return AdminRoleDto.from(savedRole);
    }

    @Override
    public AdminRoleDto toggleRoleActive(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + roleId));

        if ("ADMIN".equalsIgnoreCase(role.getCode())) {
            throw new BusinessStateException("CANNOT_TOGGLE_ADMIN_ROLE");
        }

        role.toggleActive();
        Role savedRole = roleRepository.save(role);
        log.info("Toggled active for roleId={}. Now active={}", roleId, savedRole.isActive());

        String actor = runtimePermissionService.getCurrentUsername();
        String action = savedRole.isActive() ? "ROLE_ACTIVATED" : "ROLE_DEACTIVATED";
        auditService.record(actor != null ? actor : "SYSTEM", action, "ROLE", savedRole.getId().toString(),
                "Role " + savedRole.getCode() + " set to active=" + savedRole.isActive());

        return AdminRoleDto.from(savedRole);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminRoleDto> listRoles() {
        List<AdminRoleDto> roles = roleRepository.findAllWithPermissions().stream()
                .map(AdminRoleDto::from)
                .toList();
        log.debug("Listed {} roles", roles.size());
        return roles;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminPermissionDto> listPermissions() {
        List<AdminPermissionDto> permissions = permissionRepository.findAll().stream()
                .map(AdminPermissionDto::from)
                .toList();
        log.debug("Listed {} permissions", permissions.size());
        return permissions;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminAuditLogDto> listAuditLogs() {
        List<AdminAuditLogDto> logs = auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(AdminAuditLogDto::from)
                .toList();
        log.debug("Listed {} audit logs", logs.size());
        return logs;
    }
}
