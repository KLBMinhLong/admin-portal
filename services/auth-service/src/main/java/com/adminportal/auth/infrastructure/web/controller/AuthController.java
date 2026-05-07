package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.*;
import com.adminportal.auth.application.dto.response.*;
import com.adminportal.auth.application.port.in.*;
import com.adminportal.auth.application.service.RuntimePermissionService;
import com.adminportal.auth.infrastructure.security.Encrypted;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Login / Logout / Register / Hashing Password / Forgot Password / 2FA
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final LoginUseCase    loginUseCase;
    private final VerifyTwoFactorUseCase verifyTwoFactorUseCase;
    private final LogoutUseCase   logoutUseCase;
    private final ForgotPasswordUseCase forgotPasswordUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;
    private final RegisterUseCase registerUseCase;
    private final RuntimePermissionService runtimePermissionService;

    public AuthController(LoginUseCase loginUseCase,
                          VerifyTwoFactorUseCase verifyTwoFactorUseCase,
                          LogoutUseCase logoutUseCase,
                          ForgotPasswordUseCase forgotPasswordUseCase,
                          ResetPasswordUseCase resetPasswordUseCase,
                          RegisterUseCase registerUseCase,
                          RuntimePermissionService runtimePermissionService) {
        this.loginUseCase = loginUseCase;
        this.verifyTwoFactorUseCase = verifyTwoFactorUseCase;
        this.logoutUseCase = logoutUseCase;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.registerUseCase = registerUseCase;
        this.runtimePermissionService = runtimePermissionService;
    }

    @PostMapping("/register")
    @Encrypted
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(registerUseCase.execute(req)));
    }

    @PostMapping("/login")
    @Encrypted
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(loginUseCase.execute(req)));
    }

    @PostMapping("/verify-2fa")
    @Encrypted
    public ResponseEntity<ApiResponse<LoginResponse>> verifyTwoFactor(@Valid @RequestBody TwoFactorVerifyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(verifyTwoFactorUseCase.execute(req)));
    }

    /** FE dang xuat -> BE cam co token */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Idempotency-Key") String idempotencyKey,
                                                    @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        logoutUseCase.execute(token);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    @Encrypted
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        forgotPasswordUseCase.execute(req);
        return ResponseEntity.accepted().body(ApiResponse.success("Password reset link sent"));
    }

    @PostMapping("/reset-password")
    @Encrypted
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        resetPasswordUseCase.execute(req);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
    }

    @GetMapping("/session")
    public ResponseEntity<Void> session(Authentication authentication) {
        // Endpoint này hiện tại chỉ dùng để Gateway gọi sang validate xem Token có hợp lệ/active hay không.
        // Gateway chỉ quan tâm HTTP Status Code (2xx là pass, 401 là block).
        // Trả về 204 No Content để không lộ thông tin user/role/permission trong response body qua mạng.
        return ResponseEntity.noContent().build();
    }
}
