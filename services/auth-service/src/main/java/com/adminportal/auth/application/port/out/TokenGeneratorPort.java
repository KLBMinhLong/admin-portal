package com.adminportal.auth.application.port.out;
public interface TokenGeneratorPort {
    String generate(String username, String role);
}
