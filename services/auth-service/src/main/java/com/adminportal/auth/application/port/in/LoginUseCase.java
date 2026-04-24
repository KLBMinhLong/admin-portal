package com.adminportal.auth.application.port.in;
import com.adminportal.auth.application.dto.request.LoginRequest;
import com.adminportal.auth.application.dto.response.LoginResponse;
public interface LoginUseCase {
    LoginResponse execute(LoginRequest request);
}
