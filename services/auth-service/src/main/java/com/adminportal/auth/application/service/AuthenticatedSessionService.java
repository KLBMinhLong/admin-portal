package com.adminportal.auth.application.service;

import com.adminportal.auth.application.dto.response.LoginResponse;
import com.adminportal.auth.domain.entity.User;

public interface AuthenticatedSessionService {
    LoginResponse create(User user, String deviceInfo);
}
