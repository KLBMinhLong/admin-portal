package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.request.TwoFactorVerifyRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;

public interface VerifyTwoFactorUseCase {
    LoginResponse execute(TwoFactorVerifyRequest request);
}
