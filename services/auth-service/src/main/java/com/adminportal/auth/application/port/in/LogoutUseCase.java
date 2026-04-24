package com.adminportal.auth.application.port.in;
public interface LogoutUseCase {
    void execute(String token);
}
