package com.adminportal.auth.application.service;

public interface UsernamePasswordHashService {
    String encode(String username, String rawPassword);
    boolean matches(String username, String rawPassword, String encodedPassword);
}
