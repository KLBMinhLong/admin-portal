package com.adminportal.auth.application.port.in;
import com.adminportal.auth.application.dto.request.RegisterRequest;
import com.adminportal.auth.application.dto.response.RegisterResponse;
public interface RegisterUseCase {
    RegisterResponse execute(RegisterRequest request);
}
