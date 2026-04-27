package com.adminportal.gateway.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app")
public class GatewaySecurityProperties {

    private String apiKey;
    private final Token token = new Token();
    private final Auth auth = new Auth();
    private final RateLimit rateLimit = new RateLimit();

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public Token getToken() {
        return token;
    }

    public Auth getAuth() {
        return auth;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public static class Token {
        private String secret;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }
    }

    public static class Auth {
        private String sessionPath = "/api/v1/auth/session";
        private List<String> publicPaths = new ArrayList<>();

        public String getSessionPath() {
            return sessionPath;
        }

        public void setSessionPath(String sessionPath) {
            this.sessionPath = sessionPath;
        }

        public List<String> getPublicPaths() {
            return publicPaths;
        }

        public void setPublicPaths(List<String> publicPaths) {
            this.publicPaths = publicPaths;
        }
    }

    public static class RateLimit {
        private int anonymousPerMinute = 30;
        private int authenticatedPerMinute = 60;

        public int getAnonymousPerMinute() {
            return anonymousPerMinute;
        }

        public void setAnonymousPerMinute(int anonymousPerMinute) {
            this.anonymousPerMinute = anonymousPerMinute;
        }

        public int getAuthenticatedPerMinute() {
            return authenticatedPerMinute;
        }

        public void setAuthenticatedPerMinute(int authenticatedPerMinute) {
            this.authenticatedPerMinute = authenticatedPerMinute;
        }
    }
}
