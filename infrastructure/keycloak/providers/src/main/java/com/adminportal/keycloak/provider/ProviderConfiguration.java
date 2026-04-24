package com.adminportal.keycloak.provider;

import java.util.List;
import org.keycloak.component.ComponentModel;
import org.keycloak.provider.ProviderConfigProperty;

final class ProviderConfiguration {
    static final String JDBC_URL = "jdbcUrl";
    static final String DB_USERNAME = "dbUsername";
    static final String DB_PASSWORD = "dbPassword";
    static final String DB_SCHEMA = "dbSchema";
    static final String USERS_TABLE = "usersTable";
    static final String SEARCHABLE = "searchable";
    static final String REMOTE_ENABLED = "remoteEnabled";
    static final String REMOTE_BASE_URL = "remoteBaseUrl";
    static final String REMOTE_API_KEY = "remoteApiKey";
    static final String VERIFY_PATH = "verifyPath";
    static final String LOOKUP_BY_ID_PATH = "lookupByIdPath";
    static final String LOOKUP_BY_USERNAME_PATH = "lookupByUsernamePath";
    static final String LOOKUP_BY_EMAIL_PATH = "lookupByEmailPath";
    static final String CONNECT_TIMEOUT_MILLIS = "connectTimeoutMillis";

    private ProviderConfiguration() {
    }

    static String getRequired(ComponentModel model, String key) {
        String value = model.getConfig().getFirst(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing provider config: " + key);
        }
        return value;
    }

    static String getOptional(ComponentModel model, String key, String defaultValue) {
        String value = model.getConfig().getFirst(key);
        return value == null || value.isBlank() ? defaultValue : value;
    }

    static boolean getBoolean(ComponentModel model, String key, boolean defaultValue) {
        String value = model.getConfig().getFirst(key);
        return value == null || value.isBlank() ? defaultValue : Boolean.parseBoolean(value);
    }

    static int getInt(ComponentModel model, String key, int defaultValue) {
        String value = model.getConfig().getFirst(key);
        return value == null || value.isBlank() ? defaultValue : Integer.parseInt(value);
    }

    static String sanitizeIdentifier(String value, String name) {
        if (!value.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            throw new IllegalStateException("Invalid SQL identifier for " + name);
        }
        return value;
    }

    static ProviderConfigProperty stringProperty(String name, String label, String helpText, String defaultValue) {
        ProviderConfigProperty property = new ProviderConfigProperty();
        property.setName(name);
        property.setLabel(label);
        property.setHelpText(helpText);
        property.setType(ProviderConfigProperty.STRING_TYPE);
        property.setDefaultValue(defaultValue);
        return property;
    }

    static ProviderConfigProperty booleanProperty(String name, String label, String helpText, boolean defaultValue) {
        ProviderConfigProperty property = new ProviderConfigProperty();
        property.setName(name);
        property.setLabel(label);
        property.setHelpText(helpText);
        property.setType(ProviderConfigProperty.BOOLEAN_TYPE);
        property.setDefaultValue(defaultValue);
        return property;
    }

    static List<ProviderConfigProperty> databaseProperties() {
        return List.of(
            stringProperty(JDBC_URL, "JDBC URL", "PostgreSQL connection string for the application database.",
                "jdbc:postgresql://postgres:5432/adminportal"),
            stringProperty(DB_USERNAME, "DB Username", "Database username for reading the users table.", "portaluser"),
            stringProperty(DB_PASSWORD, "DB Password", "Database password for reading the users table.", "changeme"),
            stringProperty(DB_SCHEMA, "DB Schema", "Schema that stores the application users table.", "public"),
            stringProperty(USERS_TABLE, "Users Table", "Application users table used for login.", "users"),
            booleanProperty(SEARCHABLE, "Searchable", "Expose users in Keycloak admin search.", true)
        );
    }

    static List<ProviderConfigProperty> remoteProperties() {
        return List.of(
            booleanProperty(REMOTE_ENABLED, "Remote Federation Enabled",
                "Turns outbound federation calls on. Keep false until a remote user source exists.", false),
            stringProperty(REMOTE_BASE_URL, "Remote Base URL", "Base URL of the future remote user federation API.", ""),
            stringProperty(REMOTE_API_KEY, "Remote API Key", "Optional x-api-key for the remote user source.", ""),
            stringProperty(VERIFY_PATH, "Verify Path", "Credential verification endpoint.",
                "/internal/federation/users/verify"),
            stringProperty(LOOKUP_BY_ID_PATH, "Lookup By ID Path", "Path template with {id}.",
                "/internal/federation/users/id/{id}"),
            stringProperty(LOOKUP_BY_USERNAME_PATH, "Lookup By Username Path", "Path template with {username}.",
                "/internal/federation/users/username/{username}"),
            stringProperty(LOOKUP_BY_EMAIL_PATH, "Lookup By Email Path", "Path template with {email}.",
                "/internal/federation/users/email/{email}"),
            stringProperty(CONNECT_TIMEOUT_MILLIS, "Timeout (ms)", "HTTP timeout for remote federation requests.", "3000")
        );
    }
}
