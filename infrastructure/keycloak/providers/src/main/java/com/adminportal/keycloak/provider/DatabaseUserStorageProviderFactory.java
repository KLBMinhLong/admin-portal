package com.adminportal.keycloak.provider;

import java.util.List;
import org.keycloak.component.ComponentModel;
import org.keycloak.component.ComponentValidationException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.storage.UserStorageProviderFactory;

public final class DatabaseUserStorageProviderFactory implements UserStorageProviderFactory<DatabaseUserStorageProvider> {
    public static final String PROVIDER_ID = "adminportal-db-user-provider";

    @Override
    public DatabaseUserStorageProvider create(KeycloakSession session, ComponentModel model) {
        return new DatabaseUserStorageProvider(session, model);
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getHelpText() {
        return "Primary Keycloak user storage provider backed by the Admin Portal users table.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return ProviderConfiguration.databaseProperties();
    }

    @Override
    public void validateConfiguration(KeycloakSession session,
                                      RealmModel realm,
                                      ComponentModel config) throws ComponentValidationException {
        try {
            ProviderConfiguration.getRequired(config, ProviderConfiguration.JDBC_URL);
            ProviderConfiguration.getRequired(config, ProviderConfiguration.DB_USERNAME);
            ProviderConfiguration.getRequired(config, ProviderConfiguration.DB_PASSWORD);
            ProviderConfiguration.sanitizeIdentifier(
                ProviderConfiguration.getOptional(config, ProviderConfiguration.DB_SCHEMA, "public"),
                ProviderConfiguration.DB_SCHEMA
            );
            ProviderConfiguration.sanitizeIdentifier(
                ProviderConfiguration.getOptional(config, ProviderConfiguration.USERS_TABLE, "users"),
                ProviderConfiguration.USERS_TABLE
            );
        } catch (RuntimeException ex) {
            throw new ComponentValidationException(ex.getMessage(), ex);
        }
    }
}
