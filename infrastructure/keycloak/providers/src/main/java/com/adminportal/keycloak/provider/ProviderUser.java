package com.adminportal.keycloak.provider;

record ProviderUser(
    String externalId,
    String username,
    String email,
    String firstName,
    String lastName,
    boolean enabled,
    boolean emailVerified,
    String passwordHash
) {
}
