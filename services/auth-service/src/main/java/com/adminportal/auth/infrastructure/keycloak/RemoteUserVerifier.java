package com.adminportal.auth.infrastructure.keycloak;
public interface RemoteUserVerifier {
    boolean verify(String username, String password);
}
