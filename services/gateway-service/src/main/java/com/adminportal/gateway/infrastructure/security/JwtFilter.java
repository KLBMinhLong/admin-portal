package com.adminportal.gateway.infrastructure.security;

import com.adminportal.gateway.infrastructure.config.GatewaySecurityProperties;
import com.adminportal.gateway.infrastructure.external.auth.AuthSessionClient;
import com.adminportal.gateway.infrastructure.support.ErrorResponseWriter;
import com.adminportal.gateway.infrastructure.support.GatewayRequestAttributes;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtFilter implements GlobalFilter, Ordered {

    private static final String BEARER_PREFIX = "Bearer ";

    private final GatewaySecurityProperties properties;
    private final JwtProvider jwtProvider;
    private final AuthSessionClient authSessionClient;
    private final ErrorResponseWriter errorResponseWriter;

    public JwtFilter(GatewaySecurityProperties properties,
                     JwtProvider jwtProvider,
                     AuthSessionClient authSessionClient,
                     ErrorResponseWriter errorResponseWriter) {
        this.properties = properties;
        this.jwtProvider = jwtProvider;
        this.authSessionClient = authSessionClient;
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (!path.startsWith("/api/v1/") || properties.getAuth().getPublicPaths().contains(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            return errorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Missing bearer token");
        }

        JwtProvider.JwtPrincipal principal;
        try {
            principal = jwtProvider.parse(authHeader.substring(BEARER_PREFIX.length()));
        } catch (RuntimeException exception) {
            return errorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token invalid or revoked");
        }

        exchange.getAttributes().put(GatewayRequestAttributes.USERNAME, principal.username());
        exchange.getAttributes().put(GatewayRequestAttributes.USER_ROLE, principal.role());
        exchange.getAttributes().put(GatewayRequestAttributes.USER_ID, principal.userId());
        exchange.getAttributes().put(GatewayRequestAttributes.TOKEN_JTI, principal.jti());

        String traceId = exchange.getAttributeOrDefault(GatewayRequestAttributes.TRACE_ID, "");
        String spanId = exchange.getAttributeOrDefault(GatewayRequestAttributes.SPAN_ID, "");

        return authSessionClient.validate(authHeader, traceId, spanId)
            .then(Mono.defer(() -> {
                ServerHttpRequest request = exchange.getRequest().mutate()
                    .header("X-Authenticated-User", principal.username())
                    .header("X-Authenticated-Role", principal.role())
                    .header("X-Authenticated-UserId", principal.userId())
                    .header("X-Token-Jti", principal.jti())
                    .build();
                return chain.filter(exchange.mutate().request(request).build());
            }))
            .onErrorResume(AuthSessionClient.InvalidTokenException.class,
                exception -> errorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token invalid or revoked"))
            .onErrorResume(AuthSessionClient.DownstreamAuthException.class,
                exception -> errorResponseWriter.write(exchange, HttpStatus.BAD_GATEWAY, "BAD_GATEWAY", "Auth service unavailable"));
    }

    @Override
    public int getOrder() {
        return -90;
    }
}
