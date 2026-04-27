package com.adminportal.gateway.infrastructure.security;

import com.adminportal.gateway.infrastructure.support.GatewayRequestAttributes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class TraceFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(TraceFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String traceId = headerOrRandom(exchange.getRequest(), "X-Trace-Id");
        String spanId = headerOrRandom(exchange.getRequest(), "X-Span-Id");
        exchange.getAttributes().put(GatewayRequestAttributes.TRACE_ID, traceId);
        exchange.getAttributes().put(GatewayRequestAttributes.SPAN_ID, spanId);

        ServerHttpRequest request = exchange.getRequest().mutate()
            .header("X-Trace-Id", traceId)
            .header("X-Span-Id", spanId)
            .build();

        long startedAt = System.currentTimeMillis();
        log.info("Gateway request start method={} path={} traceId={} spanId={}",
            request.getMethod(), request.getPath().value(), traceId, spanId);

        return chain.filter(exchange.mutate().request(request).build())
            .doFinally(signalType -> log.info(
                "Gateway request finish method={} path={} status={} traceId={} spanId={} durationMs={}",
                request.getMethod(),
                request.getPath().value(),
                exchange.getResponse().getStatusCode(),
                traceId,
                spanId,
                System.currentTimeMillis() - startedAt
            ));
    }

    @Override
    public int getOrder() {
        return -200;
    }

    private String headerOrRandom(ServerHttpRequest request, String headerName) {
        String value = request.getHeaders().getFirst(headerName);
        return value == null || value.isBlank() ? UUID.randomUUID().toString() : value;
    }
}
