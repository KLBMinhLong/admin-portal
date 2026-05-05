package com.adminportal.auth.application.usecase;

import com.adminportal.auth.application.dto.request.RegisterRequest;
import com.adminportal.auth.application.dto.response.RegisterResponse;
import com.adminportal.auth.application.port.in.RegisterUseCase;
import com.adminportal.auth.application.port.out.RoleRepositoryPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.application.services.UsernamePasswordHashService;
import com.adminportal.auth.domain.entity.Role;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class RegisterUseCaseImpl implements RegisterUseCase {
    private static final Logger log = LoggerFactory.getLogger(RegisterUseCaseImpl.class);

    private static final String DEFAULT_PRIMARY_ROLE = "ROLE_USER";
    private static final String DEFAULT_RBAC_ROLE = "USER";
    private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern HAS_LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern HAS_NUMBER = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_SPECIAL = Pattern.compile(".*[^a-zA-Z0-9].*");

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final UsernamePasswordHashService passwordHashService;

    public RegisterUseCaseImpl(UserRepositoryPort userRepository,
                               RoleRepositoryPort roleRepository,
                               UsernamePasswordHashService passwordHashService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordHashService = passwordHashService;
    }

    @Override
    @Transactional
    public RegisterResponse execute(RegisterRequest request) {
        String normalizedUsername = normalize(request.username());
        String normalizedEmail = normalize(request.email());

        validatePasswordPolicy(request.password());
        validateUniqueUser(normalizedUsername, normalizedEmail);

        String passwordHash = passwordHashService.encode(normalizedUsername, request.password());
        Role defaultRole = roleRepository.findByCode(DEFAULT_RBAC_ROLE)
            .orElseThrow(() -> new IllegalStateException("Default RBAC role not found: " + DEFAULT_RBAC_ROLE));

        User newUser = User.create(normalizedUsername, normalizedEmail, passwordHash, DEFAULT_PRIMARY_ROLE,
            request.firstName(), request.lastName());
        newUser.assignRoles(java.util.Set.of(defaultRole));
        User savedUser = userRepository.save(newUser);

        UUID verificationToken = UUID.randomUUID();
        log.info("User registered successfully userId={} username={}", savedUser.getId(), savedUser.getUsername());
        log.info("Verification token generated userId={} tokenId={}", savedUser.getId(), verificationToken.toString().substring(0, 8));

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
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 12) {
            throw new IllegalArgumentException("Password must be at least 12 characters");
        }
        if (!HAS_UPPERCASE.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain an uppercase letter");
        }
        if (!HAS_LOWERCASE.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain a lowercase letter");
        }
        if (!HAS_NUMBER.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain a number");
        }
        if (!HAS_SPECIAL.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must contain a special character");
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
