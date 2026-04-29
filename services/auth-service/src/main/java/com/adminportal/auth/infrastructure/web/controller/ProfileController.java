package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.ChangePasswordRequest;
import com.adminportal.auth.application.dto.response.ProfileDto;
import com.adminportal.auth.application.dto.response.Toggle2faResponse;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.infrastructure.security.Encrypted;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.util.Utils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecretGenerator secretGenerator;
    private final QrDataFactory qrDataFactory;
    private final QrGenerator qrGenerator;

    public ProfileController(UserRepositoryPort userRepository,
                             PasswordEncoder passwordEncoder,
                             SecretGenerator secretGenerator,
                             QrDataFactory qrDataFactory,
                             QrGenerator qrGenerator) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.secretGenerator = secretGenerator;
        this.qrDataFactory = qrDataFactory;
        this.qrGenerator = qrGenerator;
    }

    @GetMapping
    public ResponseEntity<ProfileDto> getProfile(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ProfileDto dto = new ProfileDto(
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getFirstName(),
                user.getLastName(),
                user.isTwoFactorEnabled(),
                user.getCreatedAt()
        );
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/change-password")
    @Encrypted
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(req.oldPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        user.changePassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/2fa/toggle")
    public ResponseEntity<Toggle2faResponse> toggle2fa(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isTwoFactorEnabled()) {
            user.disableTwoFactor();
            userRepository.save(user);
            return ResponseEntity.ok(new Toggle2faResponse(false, null));
        } else {
            String secret = secretGenerator.generate();
            user.enableTwoFactor(secret);
            userRepository.save(user);

            QrData data = qrDataFactory.newBuilder()
                    .label(user.getEmail())
                    .secret(secret)
                    .issuer("AdminPortal")
                    .build();

            try {
                String qrCodeImage = Utils.getDataUriForImage(
                        qrGenerator.generate(data),
                        qrGenerator.getImageMimeType()
                );
                return ResponseEntity.ok(new Toggle2faResponse(true, qrCodeImage));
            } catch (QrGenerationException e) {
                throw new RuntimeException("Failed to generate QR code", e);
            }
        }
    }
}
