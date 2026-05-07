package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.ChangePasswordRequest;
import com.adminportal.auth.application.dto.response.ApiResponse;
import com.adminportal.auth.application.dto.response.ProfileDto;
import com.adminportal.auth.application.dto.response.Toggle2faResponse;
import com.adminportal.auth.application.port.out.UserRepositoryPort;
import com.adminportal.auth.domain.entity.User;
import com.adminportal.auth.domain.exception.ResourceNotFoundException;
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
import com.adminportal.auth.application.service.UsernamePasswordHashService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final UserRepositoryPort userRepository;
    private final UsernamePasswordHashService passwordHashService;
    private final SecretGenerator secretGenerator;
    private final QrDataFactory qrDataFactory;
    private final QrGenerator qrGenerator;

    public ProfileController(UserRepositoryPort userRepository,
                             UsernamePasswordHashService passwordHashService,
                             SecretGenerator secretGenerator,
                             QrDataFactory qrDataFactory,
                             QrGenerator qrGenerator) {
        this.userRepository = userRepository;
        this.passwordHashService = passwordHashService;
        this.secretGenerator = secretGenerator;
        this.qrDataFactory = qrDataFactory;
        this.qrGenerator = qrGenerator;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileDto>> getProfile(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProfileDto dto = new ProfileDto(
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getFirstName(),
                user.getLastName(),
                user.isTwoFactorEnabled(),
                user.getCreatedAt()
        );
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/change-password")
    @Encrypted
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordHashService.matches(user.getUsername(), req.oldPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.success("Invalid old password"));
        }

        user.changePassword(passwordHashService.encode(user.getUsername(), req.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @PostMapping("/2fa/toggle")
    public ResponseEntity<ApiResponse<Toggle2faResponse>> toggle2fa(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isTwoFactorEnabled()) {
            user.disableTwoFactor();
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.ok(new Toggle2faResponse(false, null), "2FA disabled"));
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
                return ResponseEntity.ok(ApiResponse.ok(new Toggle2faResponse(true, qrCodeImage), "2FA enabled"));
            } catch (QrGenerationException e) {
                throw new IllegalStateException("Failed to generate QR code", e);
            }
        }
    }
}
