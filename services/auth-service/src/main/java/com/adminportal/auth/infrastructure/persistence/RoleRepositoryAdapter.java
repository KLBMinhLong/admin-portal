package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.domain.entity.Role;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class RoleRepositoryAdapter implements RoleRepositoryPort {

    private final SpringDataRoleRepository repository;

    public RoleRepositoryAdapter(SpringDataRoleRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Role> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Role> findByIdWithPermissions(UUID id) {
        return repository.findByIdWithPermissions(id);
    }

    @Override
    public Optional<Role> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public List<Role> findAllByIds(Set<UUID> ids) {
        return repository.findAllByIdIn(ids);
    }

    @Override
    public List<Role> findAllByCodes(Set<String> codes) {
        return repository.findAllByCodeIn(codes);
    }

    @Override
    public Role save(Role role) {
        return repository.save(role);
    }

    @Override
    public List<Role> findAll() {
        return repository.findAll();
    }

    @Override
    public List<Role> findAllWithPermissions() {
        return repository.findAllWithPermissions();
    }
}
