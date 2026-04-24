package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.request.ForgotPasswordRequest;

public interface ForgotPasswordUseCase {
    void execute(ForgotPasswordRequest request);
}
