package com.adminportal.auth.application.service;

import com.adminportal.auth.domain.entity.Token;

import java.util.UUID;

public interface UserSessionRevocationService {
    void revokeAll(UUID userId);
    void storeNewSession(Token token);
}
