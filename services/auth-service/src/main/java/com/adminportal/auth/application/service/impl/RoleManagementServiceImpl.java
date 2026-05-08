package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.dto.request.AdminRoleRequest;
import com.adminportal.auth.application.dto.response.AdminAuditLogDto;
import com.adminportal.auth.application.dto.response.AdminPermissionDto;
import com.adminportal.auth.application.dto.response.AdminRoleDto;
import com.adminportal.auth.application.port.out.PermissionRepositoryPort;
import com.adminportal.auth.application.port.out.RbacAuditLogRepositoryPort;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.service.RoleManagementService;
import com.adminportal.auth.domain.entity.Role;
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

    public RoleManagementServiceImpl(RoleRepositoryPort roleRepository,
                                     PermissionRepositoryPort permissionRepository,
                                     RbacAuditLogRepositoryPort auditLogRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public AdminRoleDto createRole(AdminRoleRequest request) {
        if (roleRepository.findByCode(request.code()).isPresent()) {
            throw new ResourceConflictException("Mã Role đã tồn tại: " + request.code());
        }

        Role role = Role.create(request.code(), request.name(), request.description());
        Role savedRole = roleRepository.save(role);
        log.info("Created role code={}", request.code());
        return AdminRoleDto.from(savedRole);
    }

    @Override
    public AdminRoleDto updateRole(UUID roleId, AdminRoleRequest request) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + roleId));

        role.updateInfo(request.name(), request.description());
        Role savedRole = roleRepository.save(role);
        log.info("Updated role roleId={}", roleId);
        return AdminRoleDto.from(savedRole);
    }

    @Override
    public AdminRoleDto toggleRoleActive(UUID roleId) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + roleId));

        role.toggleActive();
        Role savedRole = roleRepository.save(role);
        log.info("Toggled active for roleId={}. Now active={}", roleId, savedRole.isActive());
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
