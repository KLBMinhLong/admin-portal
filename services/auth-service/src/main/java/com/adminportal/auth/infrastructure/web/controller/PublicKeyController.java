package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.response.ApiResponse;
import com.adminportal.auth.infrastructure.security.RsaEncryptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint công khai để Frontend lấy Public Key phục vụ mã hóa Hybrid.
 */
@RestController
@RequestMapping("/api/v1/auth/security")
public class PublicKeyController {

    private final RsaEncryptionService rsaService;

    public PublicKeyController(RsaEncryptionService rsaService) {
        this.rsaService = rsaService;
    }

    @GetMapping("/public-key")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPublicKey() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "publicKey", rsaService.getPublicKey(),
            "algorithm", "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
        )));
    }
}
