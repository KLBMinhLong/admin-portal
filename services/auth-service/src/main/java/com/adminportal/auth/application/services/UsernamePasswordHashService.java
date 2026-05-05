package com.adminportal.auth.application.services;

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
public class UsernamePasswordHashService {

    private final PasswordEncoder passwordEncoder;

    public UsernamePasswordHashService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Hash a password bound to the given username.
     *
     * @param username the account username (will be lowercased)
     * @param rawPassword the plaintext password
     * @return the BCrypt hash of "username:rawPassword"
     */
    public String encode(String username, String rawPassword) {
        return passwordEncoder.encode(combine(username, rawPassword));
    }

    /**
     * Verify a raw password against a stored hash, bound to the given username.
     *
     * @param username the account username (will be lowercased)
     * @param rawPassword the plaintext password to check
     * @param encodedPassword the stored BCrypt hash
     * @return true if the password matches
     */
    public boolean matches(String username, String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(combine(username, rawPassword), encodedPassword);
    }

    private String combine(String username, String rawPassword) {
        return username.toLowerCase(Locale.ROOT) + ":" + rawPassword;
    }
}
