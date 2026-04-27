package com.adminportal.auth.application.port.out;

/**
 * Delegate credential verification to Keycloak, which in turn authenticates
 * against the configured custom user storage provider chain.
 */
public interface KeycloakPort {
    void authenticate(String username, String password);
}
