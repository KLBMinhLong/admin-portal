package com.adminportal.auth.application.services;

import com.adminportal.auth.application.dto.request.AdminRoleRequest;
import com.adminportal.auth.application.dto.response.AdminRoleDto;
import com.adminportal.auth.application.port.in.RoleManagementUseCase;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.exception.ResourceConflictException;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class RoleManagementService implements RoleManagementUseCase {

    private final RoleRepositoryPort roleRepository;

    public RoleManagementService(RoleRepositoryPort roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public AdminRoleDto createRole(AdminRoleRequest request) {
        if (roleRepository.findByCode(request.code()).isPresent()) {
            throw new ResourceConflictException("Mã Role đã tồn tại: " + request.code());
        }

        Role role = Role.create(request.code(), request.name(), request.description());
        return AdminRoleDto.from(roleRepository.save(role));
    }

    @Override
    public AdminRoleDto updateRole(UUID roleId, AdminRoleRequest request) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + roleId));

        role.updateInfo(request.name(), request.description());
        return AdminRoleDto.from(roleRepository.save(role));
    }

    @Override
    public AdminRoleDto toggleRoleActive(UUID roleId) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + roleId));

        role.toggleActive();
        return AdminRoleDto.from(roleRepository.save(role));
    }
}
