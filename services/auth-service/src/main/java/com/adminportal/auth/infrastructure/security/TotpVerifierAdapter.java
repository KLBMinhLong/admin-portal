package com.adminportal.auth.infrastructure.security;

import com.adminportal.auth.application.port.out.TwoFactorVerifierPort;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Component;

@Component
public class TotpVerifierAdapter implements TwoFactorVerifierPort {

    private final CodeVerifier codeVerifier;

    public TotpVerifierAdapter() {
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(
            new DefaultCodeGenerator(),
            new SystemTimeProvider()
        );
        verifier.setAllowedTimePeriodDiscrepancy(1);
        this.codeVerifier = verifier;
    }

    @Override
    public boolean verifyOtp(String secret, String otp) {
        return codeVerifier.isValidCode(secret, otp);
    }
}
