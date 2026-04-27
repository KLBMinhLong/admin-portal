package com.adminportal.keycloak.provider;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.keycloak.component.ComponentModel;
import org.keycloak.credential.CredentialInput;
import org.keycloak.credential.CredentialInputValidator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;
import org.keycloak.storage.StorageId;
import org.keycloak.storage.UserStorageProvider;
import org.keycloak.storage.user.UserLookupProvider;
import org.keycloak.storage.user.UserQueryProvider;
import org.mindrot.jbcrypt.BCrypt;

final class DatabaseUserStorageProvider implements UserStorageProvider, UserLookupProvider, CredentialInputValidator, UserQueryProvider {
    private final KeycloakSession session;
    private final ComponentModel model;
    private final String jdbcUrl;
    private final String dbUsername;
    private final String dbPassword;
    private final String qualifiedUsersTable;
    private final boolean searchable;

    DatabaseUserStorageProvider(KeycloakSession session, ComponentModel model) {
        this.session = session;
        this.model = model;
        this.jdbcUrl = ProviderConfiguration.getRequired(model, ProviderConfiguration.JDBC_URL);
        this.dbUsername = ProviderConfiguration.getRequired(model, ProviderConfiguration.DB_USERNAME);
        this.dbPassword = ProviderConfiguration.getRequired(model, ProviderConfiguration.DB_PASSWORD);
        String schema = ProviderConfiguration.sanitizeIdentifier(
            ProviderConfiguration.getOptional(model, ProviderConfiguration.DB_SCHEMA, "public"),
            ProviderConfiguration.DB_SCHEMA
        );
        String usersTable = ProviderConfiguration.sanitizeIdentifier(
            ProviderConfiguration.getOptional(model, ProviderConfiguration.USERS_TABLE, "users"),
            ProviderConfiguration.USERS_TABLE
        );
        this.qualifiedUsersTable = schema + "." + usersTable;
        this.searchable = ProviderConfiguration.getBoolean(model, ProviderConfiguration.SEARCHABLE, true);
    }

    @Override
    public void close() {
        // No pooled resources to release.
    }

    @Override
    public UserModel getUserById(RealmModel realm, String id) {
        return findOne("id::text = ?", StorageId.externalId(id))
            .map(user -> new ReadonlyUserAdapter(session, realm, model, user))
            .orElse(null);
    }

    @Override
    public UserModel getUserByUsername(RealmModel realm, String username) {
        return findOne("LOWER(username) = LOWER(?)", username)
            .map(user -> new ReadonlyUserAdapter(session, realm, model, user))
            .orElse(null);
    }

    @Override
    public UserModel getUserByEmail(RealmModel realm, String email) {
        return findOne("LOWER(email) = LOWER(?)", email)
            .map(user -> new ReadonlyUserAdapter(session, realm, model, user))
            .orElse(null);
    }

    @Override
    public boolean supportsCredentialType(String credentialType) {
        return PasswordCredentialModel.TYPE.equals(credentialType);
    }

    @Override
    public boolean isConfiguredFor(RealmModel realm, UserModel user, String credentialType) {
        return supportsCredentialType(credentialType);
    }

    @Override
    public boolean isValid(RealmModel realm, UserModel user, CredentialInput input) {
        if (!supportsCredentialType(input.getType())) {
            return false;
        }

        String externalId = StorageId.externalId(user.getId());
        ProviderUser stored = findByExternalId(externalId).orElse(null);
        return stored != null
            && stored.enabled()
            && stored.passwordHash() != null
            && BCrypt.checkpw(input.getChallengeResponse(), stored.passwordHash());
    }

    @Override
    public Stream<UserModel> searchForUserStream(RealmModel realm,
                                                 Map<String, String> params,
                                                 Integer firstResult,
                                                 Integer maxResults) {
        if (!searchable) {
            return Stream.empty();
        }
        return findMany(params, firstResult, maxResults).stream()
            .map(user -> (UserModel) new ReadonlyUserAdapter(session, realm, model, user));
    }

    @Override
    public Stream<UserModel> getGroupMembersStream(RealmModel realm,
                                                   org.keycloak.models.GroupModel group,
                                                   Integer firstResult,
                                                   Integer maxResults) {
        return Stream.empty();
    }

    @Override
    public Stream<UserModel> searchForUserByUserAttributeStream(RealmModel realm,
                                                                String attributeName,
                                                                String attributeValue) {
        if (!searchable) {
            return Stream.empty();
        }

        String clause = switch (attributeName) {
            case "username" -> "LOWER(username) = LOWER(?)";
            case "email" -> "LOWER(email) = LOWER(?)";
            case "firstName" -> "LOWER(first_name) = LOWER(?)";
            case "lastName" -> "LOWER(last_name) = LOWER(?)";
            default -> null;
        };
        if (clause == null) {
            return Stream.empty();
        }
        return findAll(clause, List.of(attributeValue)).stream()
            .map(user -> (UserModel) new ReadonlyUserAdapter(session, realm, model, user));
    }

    private Optional<ProviderUser> findByExternalId(String externalId) {
        return findOne("id::text = ?", externalId);
    }

    private Optional<ProviderUser> findOne(String whereClause, String value) {
        List<ProviderUser> users = findAll(whereClause, List.of(value));
        return users.stream().findFirst();
    }

    private List<ProviderUser> findMany(Map<String, String> params, Integer firstResult, Integer maxResults) {
        String search = Optional.ofNullable(params.get("search")).orElse("").trim();
        String username = Optional.ofNullable(params.get("username")).orElse("").trim();
        String email = Optional.ofNullable(params.get("email")).orElse("").trim();
        String firstName = Optional.ofNullable(params.get("firstName")).orElse("").trim();
        String lastName = Optional.ofNullable(params.get("lastName")).orElse("").trim();

        StringBuilder sql = new StringBuilder(baseSelect());
        List<String> values = new ArrayList<>();

        if (!search.isBlank()) {
            sql.append(" AND (username ILIKE ? OR email ILIKE ? OR first_name ILIKE ? OR last_name ILIKE ?)");
            String like = "%" + search + "%";
            values.add(like);
            values.add(like);
            values.add(like);
            values.add(like);
        }
        if (!username.isBlank()) {
            sql.append(" AND username ILIKE ?");
            values.add("%" + username + "%");
        }
        if (!email.isBlank()) {
            sql.append(" AND email ILIKE ?");
            values.add("%" + email + "%");
        }
        if (!firstName.isBlank()) {
            sql.append(" AND first_name ILIKE ?");
            values.add("%" + firstName + "%");
        }
        if (!lastName.isBlank()) {
            sql.append(" AND last_name ILIKE ?");
            values.add("%" + lastName + "%");
        }

        sql.append(" ORDER BY username ASC");
        if (maxResults != null) {
            sql.append(" LIMIT ").append(Math.max(maxResults, 0));
        }
        if (firstResult != null && firstResult > 0) {
            sql.append(" OFFSET ").append(firstResult);
        }

        return executeQuery(sql.toString(), values);
    }

    private List<ProviderUser> findAll(String whereClause, List<String> values) {
        return executeQuery(baseSelect() + " AND " + whereClause, values);
    }

    private List<ProviderUser> executeQuery(String sql, List<String> values) {
        try (Connection connection = DriverManager.getConnection(jdbcUrl, dbUsername, dbPassword);
             PreparedStatement statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < values.size(); i++) {
                statement.setString(i + 1, values.get(i));
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                List<ProviderUser> users = new ArrayList<>();
                while (resultSet.next()) {
                    users.add(mapRow(resultSet));
                }
                return users;
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to query database-backed Keycloak user storage", ex);
        }
    }

    private ProviderUser mapRow(ResultSet rs) throws SQLException {
        return new ProviderUser(
            rs.getString("id"),
            rs.getString("username"),
            rs.getString("email"),
            rs.getString("first_name"),
            rs.getString("last_name"),
            rs.getBoolean("is_active"),
            rs.getBoolean("is_email_verified"),
            rs.getString("password_hash")
        );
    }

    private String baseSelect() {
        return "SELECT id, username, email, first_name, last_name, is_active, is_email_verified, password_hash " +
            "FROM " + qualifiedUsersTable + " WHERE is_active = TRUE";
    }
}
