package com.adminportal.auth.application.port.out;

public interface TwoFactorVerifierPort {
    boolean verifyOtp(String secret, String otp);
}
