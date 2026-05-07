package com.adminportal.auth.application.service.impl;

import com.adminportal.auth.application.service.UsernamePasswordHashService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Service that binds password hashing to the user's username.
 * <p>
 * By prepending the normalized username to the raw password before
 * hashing, the resulting BCrypt hash becomes user-specific.
 * Copying a password hash from user A to user B in the database
 * will NOT allow user B to authenticate with user A's password,
 * because the hash was computed with user A's username as part
 * of the input.
 * </p>
 * <p>
 * <b>Format:</b> {@code BCrypt(lowercase(username) + ":" + rawPassword)}
 * </p>
 */
@Component
public class UsernamePasswordHashServiceImpl implements UsernamePasswordHashService {

    private final PasswordEncoder passwordEncoder;

    public UsernamePasswordHashServiceImpl(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public String encode(String username, String rawPassword) {
        return passwordEncoder.encode(combine(username, rawPassword));
    }

    @Override
    public boolean matches(String username, String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(combine(username, rawPassword), encodedPassword);
    }

    private String combine(String username, String rawPassword) {
        return username.toLowerCase(Locale.ROOT) + ":" + rawPassword;
    }
}
