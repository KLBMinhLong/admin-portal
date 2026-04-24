package com.adminportal.keycloak.provider;

import java.util.List;
import java.util.Map;
import org.keycloak.component.ComponentModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.storage.ReadOnlyException;
import org.keycloak.storage.StorageId;
import org.keycloak.storage.adapter.AbstractUserAdapterFederatedStorage;

final class ReadonlyUserAdapter extends AbstractUserAdapterFederatedStorage {
    private final ProviderUser user;

    ReadonlyUserAdapter(KeycloakSession session,
                        RealmModel realm,
                        ComponentModel storageProviderModel,
                        ProviderUser user) {
        super(session, realm, storageProviderModel);
        this.user = user;
    }

    ProviderUser source() {
        return user;
    }

    @Override
    public String getId() {
        return StorageId.keycloakId(storageProviderModel, user.externalId());
    }

    @Override
    public String getUsername() {
        return user.username();
    }

    @Override
    public void setUsername(String username) {
        throw new ReadOnlyException("User storage is read-only");
    }

    @Override
    public String getEmail() {
        return user.email();
    }

    @Override
    public void setEmail(String email) {
        throw new ReadOnlyException("User storage is read-only");
    }

    @Override
    public String getFirstName() {
        return user.firstName();
    }

    @Override
    public void setFirstName(String firstName) {
        throw new ReadOnlyException("User storage is read-only");
    }

    @Override
    public String getLastName() {
        return user.lastName();
    }

    @Override
    public void setLastName(String lastName) {
        throw new ReadOnlyException("User storage is read-only");
    }

    @Override
    public boolean isEnabled() {
        return user.enabled();
    }

    @Override
    public void setEnabled(boolean enabled) {
        throw new ReadOnlyException("User storage is read-only");
    }

    @Override
    public boolean isEmailVerified() {
        return user.emailVerified();
    }

    @Override
    public void setEmailVerified(boolean verified) {
        throw new ReadOnlyException("User storage is read-only");
    }

    @Override
    public Map<String, List<String>> getAttributes() {
        return Map.of(
            "username", List.of(user.username()),
            "email", user.email() == null ? List.of() : List.of(user.email()),
            "firstName", user.firstName() == null ? List.of() : List.of(user.firstName()),
            "lastName", user.lastName() == null ? List.of() : List.of(user.lastName())
        );
    }
}
