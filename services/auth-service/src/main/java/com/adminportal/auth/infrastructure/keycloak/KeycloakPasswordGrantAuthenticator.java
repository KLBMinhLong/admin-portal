package com.adminportal.auth.infrastructure.keycloak;

import com.adminportal.auth.application.port.out.KeycloakPort;
import com.adminportal.auth.infrastructure.keycloak.config.KeycloakAuthenticationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Validate credentials against Keycloak direct grant so the active user storage
 * provider configuration stays the single source of truth for password checks.
 */
@Component
public class KeycloakPasswordGrantAuthenticator implements KeycloakPort {
    private static final Logger log = LoggerFactory.getLogger(KeycloakPasswordGrantAuthenticator.class);

    private final RestClient restClient;
    private final KeycloakAuthenticationProperties properties;

    public KeycloakPasswordGrantAuthenticator(RestClient.Builder restClientBuilder,
                                              KeycloakAuthenticationProperties properties) {
        this.restClient = restClientBuilder.baseUrl(properties.getServerUrl()).build();
        this.properties = properties;
    }

    @Override
    public void authenticate(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", properties.getClientId());
        if (properties.hasClientSecret()) {
            form.add("client_secret", properties.getClientSecret());
        }
        form.add("username", username);
        form.add("password", password);
        form.add("scope", "openid");

        try {
            restClient.post()
                .uri(properties.tokenEndpointPath())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 400 || ex.getStatusCode().value() == 401) {
                throw new IllegalArgumentException("Invalid credentials");
            }
            log.error("Keycloak credential validation failed with status={} body={}",
                ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new IllegalStateException("Authentication provider unavailable", ex);
        } catch (RestClientException ex) {
            log.error("Keycloak credential validation failed due to transport error", ex);
            throw new IllegalStateException("Authentication provider unavailable", ex);
        }
    }
}
