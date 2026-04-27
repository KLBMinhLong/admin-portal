package com.adminportal.gateway.infrastructure.external.auth;

import com.adminportal.gateway.infrastructure.config.GatewaySecurityProperties;
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
public class AuthSessionClient {

    private final WebClient webClient;
    private final GatewaySecurityProperties properties;

    public AuthSessionClient(WebClient.Builder webClientBuilder,
                             GatewaySecurityProperties properties,
                             @Value("${AUTH_SERVICE_URL:http://localhost:8081}") String authServiceUrl) {
        this.webClient = webClientBuilder
            .baseUrl(authServiceUrl)
            .build();
        this.properties = properties;
    }

    public Mono<Void> validate(String bearerToken, String traceId, String spanId) {
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
                    return Mono.<Void>error(new InvalidTokenException());
                }
                return response.bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .flatMap(body -> Mono.<Void>error(new DownstreamAuthException("Auth service validation failed with status " + response.statusCode().value())));
            })
            .timeout(Duration.ofSeconds(3))
            .onErrorMap(TimeoutException.class, exception -> new DownstreamAuthException("Auth service validation timed out", exception))
            .onErrorMap(WebClientRequestException.class, exception -> new DownstreamAuthException("Auth service validation connection failed", exception));
    }

    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException() {
            super("Token invalid or revoked");
        }
    }

    public static class DownstreamAuthException extends RuntimeException {
        public DownstreamAuthException(String message) {
            super(message);
        }

        public DownstreamAuthException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
