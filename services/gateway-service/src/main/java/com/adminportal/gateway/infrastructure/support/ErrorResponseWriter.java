package com.adminportal.gateway.infrastructure.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Component
public class ErrorResponseWriter {

    private final ObjectMapper objectMapper;

    public ErrorResponseWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Mono<Void> write(ServerWebExchange exchange, HttpStatus status, String code, String message) {
        String traceId = attribute(exchange, GatewayRequestAttributes.TRACE_ID);
        String spanId = attribute(exchange, GatewayRequestAttributes.SPAN_ID);
        GatewayErrorResponse body = new GatewayErrorResponse(
            code,
            message,
            exchange.getRequest().getPath().value(),
            traceId,
            spanId,
            Instant.now().toString()
        );
        byte[] payload = toJson(body);

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().set(HttpHeaders.CACHE_CONTROL, "no-store");
        exchange.getResponse().getHeaders().set("X-Trace-Id", traceId);
        exchange.getResponse().getHeaders().set("X-Span-Id", spanId);

        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(payload)));
    }

    private String attribute(ServerWebExchange exchange, String key) {
        return exchange.getAttributeOrDefault(key, UUID.randomUUID().toString());
    }

    private byte[] toJson(GatewayErrorResponse response) {
        try {
            return objectMapper.writeValueAsBytes(response);
        } catch (JsonProcessingException exception) {
            return ("{\"code\":\"SERIALIZATION_ERROR\",\"message\":\"" + response.message() + "\"}")
                .getBytes(StandardCharsets.UTF_8);
        }
    }
}
