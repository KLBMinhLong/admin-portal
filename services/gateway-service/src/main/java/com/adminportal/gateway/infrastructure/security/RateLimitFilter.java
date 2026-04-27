package com.adminportal.gateway.infrastructure.security;

import com.adminportal.gateway.infrastructure.config.GatewaySecurityProperties;
import com.adminportal.gateway.infrastructure.support.ErrorResponseWriter;
import com.adminportal.gateway.infrastructure.support.GatewayRequestAttributes;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final GatewaySecurityProperties properties;
    private final ErrorResponseWriter errorResponseWriter;

    public RateLimitFilter(GatewaySecurityProperties properties, ErrorResponseWriter errorResponseWriter) {
        this.properties = properties;
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (!path.startsWith("/api/v1/")) {
            return chain.filter(exchange);
        }

        String username = exchange.getAttribute(GatewayRequestAttributes.USERNAME);
        String key = username != null ? "user:" + username : "ip:" + remoteAddress(exchange);
        int limit = username != null
            ? properties.getRateLimit().getAuthenticatedPerMinute()
            : properties.getRateLimit().getAnonymousPerMinute();

        if (!allow(key, limit)) {
            return errorResponseWriter.write(exchange, HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_REQUESTS", "Rate limit exceeded");
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -80;
    }

    private boolean allow(String key, int limit) {
        long currentWindow = Instant.now().getEpochSecond() / 60;
        WindowCounter counter = counters.compute(key, (ignored, existing) -> {
            if (existing == null || existing.window() != currentWindow) {
                return new WindowCounter(currentWindow, 1);
            }
            return new WindowCounter(currentWindow, existing.count() + 1);
        });
        return counter.count() <= limit;
    }

    private String remoteAddress(ServerWebExchange exchange) {
        if (exchange.getRequest().getRemoteAddress() == null) {
            return "unknown";
        }
        return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
    }

    private record WindowCounter(long window, int count) {
    }
}
