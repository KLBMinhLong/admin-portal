package com.adminportal.gateway.infrastructure.security;

import com.adminportal.gateway.infrastructure.config.GatewaySecurityProperties;
import com.adminportal.gateway.infrastructure.support.ErrorResponseWriter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class ApiKeyFilter implements GlobalFilter, Ordered {

    private final GatewaySecurityProperties properties;
    private final ErrorResponseWriter errorResponseWriter;

    public ApiKeyFilter(GatewaySecurityProperties properties, ErrorResponseWriter errorResponseWriter) {
        this.properties = properties;
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (!path.startsWith("/api/v1/")) {
            return chain.filter(exchange);
        }

        String incomingKey = exchange.getRequest().getHeaders().getFirst("x-api-key");
        if (incomingKey == null || !incomingKey.equals(properties.getApiKey())) {
            return errorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, "INVALID_API_KEY", "Invalid API key");
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
