package com.adminportal.auth.application.port.in;

import com.adminportal.auth.application.dto.request.ResetPasswordRequest;

public interface ResetPasswordUseCase {
    void execute(ResetPasswordRequest request);
}
