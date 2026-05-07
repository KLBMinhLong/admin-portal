package com.adminportal.gateway.infrastructure.external.auth;

import com.adminportal.gateway.infrastructure.config.GatewaySecurityProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

@Component
@Slf4j
public class DefaultAuthSessionClient implements AuthSessionClient {

    private final WebClient webClient;
    private final GatewaySecurityProperties properties;

    public DefaultAuthSessionClient(WebClient.Builder webClientBuilder,
                                    GatewaySecurityProperties properties,
                                    @Value("${AUTH_SERVICE_URL:http://localhost:8081}") String authServiceUrl) {
        this.webClient = webClientBuilder
            .baseUrl(authServiceUrl)
            .build();
        this.properties = properties;
    }

    @Override
    public Mono<Void> validate(String bearerToken, String traceId, String spanId) {
        log.debug("[Auth] Validating session with traceId: {}", traceId);
        return webClient.get()
            .uri(properties.getAuth().getSessionPath())
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .header("x-api-key", properties.getApiKey())
            .header("X-Trace-Id", traceId)
            .header("X-Span-Id", spanId)
            .exchangeToMono(response -> {
                if (response.statusCode().is2xxSuccessful()) {
                    return Mono.<Void>empty();
                }
                if (response.statusCode() == HttpStatus.UNAUTHORIZED || response.statusCode() == HttpStatus.FORBIDDEN) {
                    log.warn("[Auth] Validation failed for traceId: {}. Status: {}", traceId, response.statusCode());
                    return Mono.<Void>error(new InvalidTokenException());
                }
                return response.bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .flatMap(body -> {
                        log.error("[Auth] Unexpected error from Auth Service for traceId: {}. Status: {}, Body: {}", traceId, response.statusCode(), body);
                        return Mono.<Void>error(new DownstreamAuthException("Auth service validation failed with status " + response.statusCode().value()));
                    });
            })
            .timeout(Duration.ofSeconds(3))
            .onErrorMap(TimeoutException.class, exception -> {
                log.error("[Auth] Validation timed out for traceId: {}", traceId);
                return new DownstreamAuthException("Auth service validation timed out", exception);
            })
            .onErrorMap(WebClientRequestException.class, exception -> {
                log.error("[Auth] Connection to Auth Service failed for traceId: {}. Error: {}", traceId, exception.getMessage());
                return new DownstreamAuthException("Auth service validation connection failed", exception);
            });
    }
}
