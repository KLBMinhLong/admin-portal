package com.adminportal.auth.infrastructure.persistence;

import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final SpringDataUserRepository repository;

    public UserRepositoryAdapter(SpringDataUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public User save(User user) {
        return repository.save(user);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<User> findByIdWithRolesAndPermissions(UUID id) {
        return repository.findByIdWithRolesAndPermissions(id);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return repository.findByUsername(username);
    }

    @Override
    public Optional<User> findByUsernameForUpdate(String username) {
        return repository.findByUsernameForUpdate(username);
    }

    @Override
    public Optional<User> findByUsernameWithRolesAndPermissions(String username) {
        return repository.findByUsernameWithRolesAndPermissions(username);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return repository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }
}
