package com.adminportal.auth.infrastructure.web.controller;

import com.adminportal.auth.application.dto.request.*;
import com.adminportal.auth.application.dto.response.*;
import com.adminportal.auth.application.port.in.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    public AuthController(LoginUseCase loginUseCase,
                          VerifyTwoFactorUseCase verifyTwoFactorUseCase,
                          LogoutUseCase logoutUseCase,
                          ForgotPasswordUseCase forgotPasswordUseCase,
                          ResetPasswordUseCase resetPasswordUseCase,
                          RegisterUseCase registerUseCase) {
        this.loginUseCase = loginUseCase;
        this.verifyTwoFactorUseCase = verifyTwoFactorUseCase;
        this.logoutUseCase = logoutUseCase;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.registerUseCase = registerUseCase;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registerUseCase.execute(req));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(loginUseCase.execute(req));
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<LoginResponse> verifyTwoFactor(@Valid @RequestBody TwoFactorVerifyRequest req) {
        return ResponseEntity.ok(verifyTwoFactorUseCase.execute(req));
    }

    /** FE dang xuat -> BE cam co token */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Idempotency-Key") String idempotencyKey,
                                       @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        logoutUseCase.execute(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        forgotPasswordUseCase.execute(req);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        resetPasswordUseCase.execute(req);
        return ResponseEntity.ok().build();
    }
}
