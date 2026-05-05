package com.adminportal.auth.application.services;

import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.application.port.out.GeneratedToken;
import com.adminportal.auth.application.port.out.TokenGeneratorPort;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;

@Service
public class AuthenticatedSessionService {
    private static final Logger log = LoggerFactory.getLogger(AuthenticatedSessionService.class);

    private final UserSessionRevocationService userSessionRevocationService;
    private final TokenGeneratorPort tokenGenerator;
    private final RuntimePermissionService runtimePermissionService;

    public AuthenticatedSessionService(UserSessionRevocationService userSessionRevocationService,
                                       TokenGeneratorPort tokenGenerator,
                                       RuntimePermissionService runtimePermissionService) {
        this.userSessionRevocationService = userSessionRevocationService;
        this.tokenGenerator = tokenGenerator;
        this.runtimePermissionService = runtimePermissionService;
    }

    public LoginResponse create(User user, String deviceInfo) {
        userSessionRevocationService.revokeAll(user.getId());

        GeneratedToken generatedToken = tokenGenerator.generate(user);
        Token newToken = Token.issue(
            user.getId(),
            generatedToken.jti(),
            sha256(generatedToken.value()),
            generatedToken.issuedAt(),
            null,
            deviceInfo
        );

        userSessionRevocationService.storeNewSession(newToken);
        log.info("Token created for userId={}", user.getId());

        Set<String> allAuths = runtimePermissionService.getAllAuthorities(user.getUsername());
        List<String> authorities = new ArrayList<>(allAuths);

        return LoginResponse.success(
            generatedToken.value(),
            user.getId().toString(),
            user.getUsername(),
            user.getRole(),
            authorities
        );
    }

    private String sha256(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] hash = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", exception);
        }
    }
}
