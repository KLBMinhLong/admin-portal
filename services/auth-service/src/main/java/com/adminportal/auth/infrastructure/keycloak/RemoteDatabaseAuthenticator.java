package com.adminportal.auth.infrastructure.keycloak;

import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Auth adapter dung de verify user credentials truoc khi login.
 * TODO(UC-AUTH-02): thay the bang remote Keycloak integration thuc te.
 */
@Component
public class RemoteDatabaseAuthenticator implements KeycloakPort {

    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;

    public RemoteDatabaseAuthenticator(UserRepositoryPort userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void authenticate(String username, String password) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
    }
}
