package com.adminportal.auth.application.port.out;
/** Delegate credential verification to Keycloak custom provider */
public interface KeycloakPort {
    void authenticate(String username, String password);
}
