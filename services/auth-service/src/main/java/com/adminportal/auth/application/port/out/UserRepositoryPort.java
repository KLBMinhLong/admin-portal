package com.adminportal.auth.application.port.out;
import com.adminportal.auth.domain.entity.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface UserRepositoryPort {
    User save(User user);
    Optional<User> findById(UUID id);
    Optional<User> findByIdWithRolesAndPermissions(UUID id);
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameForUpdate(String username);
    Optional<User> findByUsernameWithRolesAndPermissions(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findAll();
}
