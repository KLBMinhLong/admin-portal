package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.RegisterRequest;
import com.adminportal.auth.application.dto.response.RegisterResponse;
import com.adminportal.auth.application.port.in.RegisterUseCase;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.service.PasswordPolicy;
import com.adminportal.auth.application.service.UsernamePasswordHashService;
import com.adminportal.auth.application.util.DataNormalizer;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.ResourceConflictException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegisterUseCaseImpl implements RegisterUseCase {
    private static final Logger log = LoggerFactory.getLogger(RegisterUseCaseImpl.class);

    private static final String DEFAULT_PRIMARY_ROLE = "ROLE_USER";
    private static final String DEFAULT_RBAC_ROLE = "USER";

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final UsernamePasswordHashService passwordHashService;
    private final PasswordPolicy passwordPolicy;

    public RegisterUseCaseImpl(UserRepositoryPort userRepository,
                               RoleRepositoryPort roleRepository,
                               UsernamePasswordHashService passwordHashService,
                               PasswordPolicy passwordPolicy) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordHashService = passwordHashService;
        this.passwordPolicy = passwordPolicy;
    }

    @Override
    @Transactional
    public RegisterResponse execute(RegisterRequest request) {
        String normalizedUsername = DataNormalizer.normalizeUsername(request.username());
        String normalizedEmail = DataNormalizer.normalizeEmail(request.email());

        passwordPolicy.validate(request.password());
        validateUniqueUser(normalizedUsername, normalizedEmail);

        String passwordHash = passwordHashService.encode(normalizedUsername, request.password());
        Role defaultRole = roleRepository.findByCode(DEFAULT_RBAC_ROLE)
            .orElseThrow(() -> new IllegalStateException("Default RBAC role not found: " + DEFAULT_RBAC_ROLE));

        User newUser = User.create(normalizedUsername, normalizedEmail, passwordHash, DEFAULT_PRIMARY_ROLE,
            request.firstName(), request.lastName());
        newUser.assignRoles(java.util.Set.of(defaultRole));
        User savedUser = userRepository.save(newUser);

        log.info("User registered successfully userId={} username={}", savedUser.getId(), savedUser.getUsername());

        return new RegisterResponse(
            savedUser.getId().toString(),
            savedUser.getUsername(),
            savedUser.getEmail(),
            false,
            "Registered successfully. Please verify your email."
        );
    }

    private void validateUniqueUser(String username, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new ResourceConflictException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ResourceConflictException("Email already exists");
        }
    }
}
