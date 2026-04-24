package com.adminportal.keycloak.provider;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
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

final class RemoteUserFederationProvider implements UserStorageProvider, UserLookupProvider, CredentialInputValidator, UserQueryProvider {
    private final KeycloakSession session;
    private final ComponentModel model;
    private final boolean remoteEnabled;
    private final String remoteBaseUrl;
    private final String remoteApiKey;
    private final String verifyPath;
    private final String lookupByIdPath;
    private final String lookupByUsernamePath;
    private final String lookupByEmailPath;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    RemoteUserFederationProvider(KeycloakSession session, ComponentModel model) {
        this.session = session;
        this.model = model;
        this.remoteEnabled = ProviderConfiguration.getBoolean(model, ProviderConfiguration.REMOTE_ENABLED, false);
        this.remoteBaseUrl = ProviderConfiguration.getOptional(model, ProviderConfiguration.REMOTE_BASE_URL, "");
        this.remoteApiKey = ProviderConfiguration.getOptional(model, ProviderConfiguration.REMOTE_API_KEY, "");
        this.verifyPath = ProviderConfiguration.getOptional(model, ProviderConfiguration.VERIFY_PATH,
            "/internal/federation/users/verify");
        this.lookupByIdPath = ProviderConfiguration.getOptional(model, ProviderConfiguration.LOOKUP_BY_ID_PATH,
            "/internal/federation/users/id/{id}");
        this.lookupByUsernamePath = ProviderConfiguration.getOptional(model, ProviderConfiguration.LOOKUP_BY_USERNAME_PATH,
            "/internal/federation/users/username/{username}");
        this.lookupByEmailPath = ProviderConfiguration.getOptional(model, ProviderConfiguration.LOOKUP_BY_EMAIL_PATH,
            "/internal/federation/users/email/{email}");
        int timeoutMillis = ProviderConfiguration.getInt(model, ProviderConfiguration.CONNECT_TIMEOUT_MILLIS, 3000);
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(timeoutMillis))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void close() {
        // HttpClient is shared and does not require explicit cleanup.
    }

    @Override
    public UserModel getUserById(RealmModel realm, String id) {
        return fetchUser(lookupByIdPath, "id", StorageId.externalId(id))
            .map(user -> new ReadonlyUserAdapter(session, realm, model, user))
            .orElse(null);
    }

    @Override
    public UserModel getUserByUsername(RealmModel realm, String username) {
        return fetchUser(lookupByUsernamePath, "username", username)
            .map(user -> new ReadonlyUserAdapter(session, realm, model, user))
            .orElse(null);
    }

    @Override
    public UserModel getUserByEmail(RealmModel realm, String email) {
        return fetchUser(lookupByEmailPath, "email", email)
            .map(user -> new ReadonlyUserAdapter(session, realm, model, user))
            .orElse(null);
    }

    @Override
    public boolean supportsCredentialType(String credentialType) {
        return PasswordCredentialModel.TYPE.equals(credentialType);
    }

    @Override
    public boolean isConfiguredFor(RealmModel realm, UserModel user, String credentialType) {
        return remoteEnabled && supportsCredentialType(credentialType);
    }

    @Override
    public boolean isValid(RealmModel realm, UserModel user, CredentialInput input) {
        if (!remoteEnabled || !supportsCredentialType(input.getType())) {
            return false;
        }
        return verifyCredentials(user.getUsername(), input.getChallengeResponse());
    }

    @Override
    public Stream<UserModel> searchForUserStream(RealmModel realm,
                                                 Map<String, String> params,
                                                 Integer firstResult,
                                                 Integer maxResults) {
        return Stream.empty();
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
        return Stream.empty();
    }

    private Optional<ProviderUser> fetchUser(String pathTemplate, String placeholder, String value) {
        if (!remoteEnabled || remoteBaseUrl.isBlank()) {
            return Optional.empty();
        }

        HttpRequest request = withHeaders(HttpRequest.newBuilder(resolve(pathTemplate, placeholder, value)))
            .GET()
            .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                return Optional.empty();
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Remote federation lookup failed with HTTP " + response.statusCode());
            }
            RemoteUserPayload payload = objectMapper.readValue(response.body(), RemoteUserPayload.class);
            return Optional.of(payload.toProviderUser());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Remote federation lookup failed", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Remote federation lookup failed", ex);
        }
    }

    private boolean verifyCredentials(String username, String password) {
        if (remoteBaseUrl.isBlank()) {
            return false;
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", password
            ));
            HttpRequest request = withHeaders(HttpRequest.newBuilder(resolve(verifyPath, null, null)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 400 || response.statusCode() == 401 || response.statusCode() == 404) {
                return false;
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Remote federation credential verification failed with HTTP " + response.statusCode());
            }
            return true;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Remote federation credential verification failed", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Remote federation credential verification failed", ex);
        }
    }

    private HttpRequest.Builder withHeaders(HttpRequest.Builder builder) {
        builder.timeout(Duration.ofSeconds(3));
        if (!remoteApiKey.isBlank()) {
            builder.header("x-api-key", remoteApiKey);
        }
        builder.header("Accept", "application/json");
        return builder;
    }

    private URI resolve(String pathTemplate, String placeholder, String value) {
        String path = pathTemplate;
        if (placeholder != null) {
            path = path.replace("{" + placeholder + "}", URLEncoder.encode(value, StandardCharsets.UTF_8));
        }
        return URI.create(remoteBaseUrl + path);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RemoteUserPayload(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        Boolean enabled,
        Boolean emailVerified
    ) {
        ProviderUser toProviderUser() {
            return new ProviderUser(
                id != null ? id : username,
                username,
                email,
                firstName,
                lastName,
                enabled == null || enabled,
                emailVerified != null && emailVerified,
                null
            );
        }
    }
}
