package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.application.port.out.PermissionRepositoryPort;
import com.adminportal.auth.domain.entity.Permission;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public class PermissionRepositoryAdapter implements PermissionRepositoryPort {

    private final SpringDataPermissionRepository repository;

    public PermissionRepositoryAdapter(SpringDataPermissionRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Permission> findAllByIds(Set<UUID> ids) {
        return repository.findAllByIdIn(ids);
    }

    @Override
    public List<Permission> findAllByCodes(Set<String> codes) {
        return repository.findAllByCodeIn(codes);
    }

    @Override
    public List<Permission> findAll() {
        return repository.findAll();
    }
}
