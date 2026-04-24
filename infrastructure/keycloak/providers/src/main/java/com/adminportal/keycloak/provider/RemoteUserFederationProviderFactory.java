package com.adminportal.keycloak.provider;

import java.util.List;
import org.keycloak.component.ComponentModel;
import org.keycloak.component.ComponentValidationException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.storage.UserStorageProviderFactory;

public final class RemoteUserFederationProviderFactory implements UserStorageProviderFactory<RemoteUserFederationProvider> {
    public static final String PROVIDER_ID = "adminportal-remote-user-federation";

    @Override
    public RemoteUserFederationProvider create(KeycloakSession session, ComponentModel model) {
        return new RemoteUserFederationProvider(session, model);
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getHelpText() {
        return "Reserved remote federation provider for future external user stores. Keep disabled for login today.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return ProviderConfiguration.remoteProperties();
    }

    @Override
    public void validateConfiguration(KeycloakSession session,
                                      RealmModel realm,
                                      ComponentModel config) throws ComponentValidationException {
        try {
            boolean enabled = ProviderConfiguration.getBoolean(config, ProviderConfiguration.REMOTE_ENABLED, false);
            if (enabled) {
                ProviderConfiguration.getRequired(config, ProviderConfiguration.REMOTE_BASE_URL);
            }
        } catch (RuntimeException ex) {
            throw new ComponentValidationException(ex.getMessage(), ex);
        }
    }
}
