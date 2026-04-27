package com.adminportal.gateway.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DisplayName("Gateway integration tests")
class GatewayIntegrationTest {

    private static final String API_KEY = "gateway-test-api-key";
    private static final String TOKEN_SECRET = "supersecretkey_changeme_in_production_min32chars";
    private static final StubBackend AUTH_BACKEND = StubBackend.auth();
    private static final StubBackend DOMAIN_BACKEND = StubBackend.domain();

    static {
        AUTH_BACKEND.start();
        DOMAIN_BACKEND.start();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("AUTH_SERVICE_URL", AUTH_BACKEND::baseUrl);
        registry.add("DOMAIN_SERVICE_URL", DOMAIN_BACKEND::baseUrl);
        registry.add("API_KEY", () -> API_KEY);
        registry.add("TOKEN_SECRET", () -> TOKEN_SECRET);
        registry.add("GATEWAY_AUTH_RATE_LIMIT", () -> "2");
        registry.add("GATEWAY_ANON_RATE_LIMIT", () -> "3");
    }

    @LocalServerPort
    int port;

    @Autowired
    ObjectMapper objectMapper;

    WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        AUTH_BACKEND.reset();
        DOMAIN_BACKEND.reset();
        webTestClient = WebTestClient.bindToServer()
            .baseUrl("http://localhost:" + port)
            .build();
    }

    @AfterAll
    static void tearDown() {
        AUTH_BACKEND.stop();
        DOMAIN_BACKEND.stop();
    }

    @Test
    @DisplayName("Should route public auth request without JWT")
    void shouldRoutePublicAuthRequestWithoutJwt() {
        webTestClient.post()
            .uri("/api/v1/auth/login")
            .header("x-api-key", API_KEY)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{\"username\":\"alice\",\"password\":\"secret\"}")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.service").isEqualTo("auth")
            .jsonPath("$.path").isEqualTo("/api/v1/auth/login");

        assertThat(AUTH_BACKEND.authLoginHits.get()).isEqualTo(1);
        assertThat(AUTH_BACKEND.authSessionHits.get()).isZero();
    }

    @Test
    @DisplayName("Should reject invalid API key before JWT")
    void shouldRejectInvalidApiKeyBeforeJwt() {
        webTestClient.get()
            .uri("/api/v1/requests/1")
            .header("x-api-key", "wrong-key")
            .exchange()
            .expectStatus().isUnauthorized()
            .expectBody()
            .jsonPath("$.code").isEqualTo("INVALID_API_KEY");

        assertThat(AUTH_BACKEND.authSessionHits.get()).isZero();
        assertThat(DOMAIN_BACKEND.domainHits.get()).isZero();
    }

    @Test
    @DisplayName("Should reject missing JWT on protected route")
    void shouldRejectMissingJwtOnProtectedRoute() {
        webTestClient.get()
            .uri("/api/v1/requests/1")
            .header("x-api-key", API_KEY)
            .exchange()
            .expectStatus().isUnauthorized()
            .expectBody()
            .jsonPath("$.code").isEqualTo("INVALID_TOKEN");

        assertThat(AUTH_BACKEND.authSessionHits.get()).isZero();
    }

    @Test
    @DisplayName("Should reject revoked token based on auth-service validation")
    void shouldRejectRevokedToken() {
        webTestClient.get()
            .uri("/api/v1/requests/1")
            .header("x-api-key", API_KEY)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + createToken("revoked-user"))
            .exchange()
            .expectStatus().isUnauthorized()
            .expectBody()
            .jsonPath("$.code").isEqualTo("INVALID_TOKEN");

        assertThat(AUTH_BACKEND.authSessionHits.get()).isEqualTo(1);
        assertThat(DOMAIN_BACKEND.domainHits.get()).isZero();
    }

    @Test
    @DisplayName("Should route protected domain request with trace and auth headers")
    void shouldRouteProtectedDomainRequestWithTraceAndAuthHeaders() {
        webTestClient.get()
            .uri("/api/v1/requests/42")
            .header("x-api-key", API_KEY)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + createToken("route-user"))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.service").isEqualTo("domain")
            .jsonPath("$.path").isEqualTo("/api/v1/requests/42");

        assertThat(AUTH_BACKEND.authSessionHits.get()).isEqualTo(1);
        assertThat(DOMAIN_BACKEND.domainHits.get()).isEqualTo(1);
        assertThat(DOMAIN_BACKEND.lastHeaders.get("x-authenticated-user")).isEqualTo("route-user");
        assertThat(DOMAIN_BACKEND.lastHeaders.get("x-trace-id")).isNotBlank();
        assertThat(DOMAIN_BACKEND.lastHeaders.get("x-span-id")).isNotBlank();
    }

    @Test
    @DisplayName("Should enforce per-user rate limit")
    void shouldEnforcePerUserRateLimit() {
        String token = createToken("rate-user");

        webTestClient.get()
            .uri("/api/v1/requests/1")
            .header("x-api-key", API_KEY)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .exchange()
            .expectStatus().isOk();

        webTestClient.get()
            .uri("/api/v1/requests/2")
            .header("x-api-key", API_KEY)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .exchange()
            .expectStatus().isOk();

        webTestClient.get()
            .uri("/api/v1/requests/3")
            .header("x-api-key", API_KEY)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .exchange()
            .expectStatus().isEqualTo(429)
            .expectBody()
            .jsonPath("$.code").isEqualTo("TOO_MANY_REQUESTS");
    }

    private String createToken(String username) {
        SecretKey secretKey = Keys.hmacShaKeyFor(TOKEN_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
            .subject(username)
            .claim("username", username)
            .claim("role", "USER")
            .claim("userId", UUID.randomUUID().toString())
            .id(UUID.randomUUID().toString())
            .issuedAt(Date.from(Instant.now()))
            .signWith(secretKey)
            .compact();
    }

    private static final class StubBackend {
        private final HttpServer server;
        private final String serviceName;
        private final AtomicInteger authLoginHits = new AtomicInteger();
        private final AtomicInteger authSessionHits = new AtomicInteger();
        private final AtomicInteger domainHits = new AtomicInteger();
        private final Map<String, String> lastHeaders = new ConcurrentHashMap<>();

        private StubBackend(HttpServer server, String serviceName) {
            this.server = server;
            this.serviceName = serviceName;
        }

        static StubBackend auth() {
            try {
                HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
                StubBackend backend = new StubBackend(server, "auth");
                server.createContext("/api/v1/auth/login", backend.authLoginHandler());
                server.createContext("/api/v1/auth/session", backend.authSessionHandler());
                return backend;
            } catch (IOException exception) {
                throw new IllegalStateException("Failed to start auth backend", exception);
            }
        }

        static StubBackend domain() {
            try {
                HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
                StubBackend backend = new StubBackend(server, "domain");
                server.createContext("/api/v1/requests", backend.domainHandler());
                return backend;
            } catch (IOException exception) {
                throw new IllegalStateException("Failed to start domain backend", exception);
            }
        }

        void start() {
            server.start();
        }

        void stop() {
            server.stop(0);
        }

        void reset() {
            authLoginHits.set(0);
            authSessionHits.set(0);
            domainHits.set(0);
            lastHeaders.clear();
        }

        String baseUrl() {
            return "http://localhost:" + server.getAddress().getPort();
        }

        private HttpHandler authLoginHandler() {
            return exchange -> {
                authLoginHits.incrementAndGet();
                writeJson(exchange, 200, Map.of("service", serviceName, "path", exchange.getRequestURI().getPath()));
            };
        }

        private HttpHandler authSessionHandler() {
            return exchange -> {
                authSessionHits.incrementAndGet();
                String apiKey = exchange.getRequestHeaders().getFirst("x-api-key");
                String authHeader = exchange.getRequestHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (!API_KEY.equals(apiKey) || authHeader == null) {
                    writeJson(exchange, 401, Map.of("code", "INVALID_TOKEN"));
                    return;
                }
                String token = authHeader.replace("Bearer ", "");
                String username = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(TOKEN_SECRET.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("username", String.class);
                if ("revoked-user".equals(username)) {
                    writeJson(exchange, 401, Map.of("code", "INVALID_TOKEN"));
                    return;
                }
                writeJson(exchange, 200, Map.of("username", username));
            };
        }

        private HttpHandler domainHandler() {
            return exchange -> {
                domainHits.incrementAndGet();
                exchange.getRequestHeaders().forEach((key, values) -> lastHeaders.put(key.toLowerCase(), values.get(0)));
                writeJson(exchange, 200, Map.of("service", serviceName, "path", exchange.getRequestURI().getPath()));
            };
        }

        private void writeJson(HttpExchange exchange, int status, Map<String, Object> body) throws IOException {
            byte[] payload = new ObjectMapper().writeValueAsBytes(body);
            exchange.getResponseHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            exchange.sendResponseHeaders(status, payload.length);
            try (OutputStream outputStream = exchange.getResponseBody()) {
                outputStream.write(payload);
            }
        }
    }
}
