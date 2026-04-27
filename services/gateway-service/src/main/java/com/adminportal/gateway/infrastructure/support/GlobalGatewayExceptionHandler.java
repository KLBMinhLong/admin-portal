package com.adminportal.gateway.infrastructure.support;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.net.UnknownHostException;
import java.util.concurrent.TimeoutException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalGatewayExceptionHandler implements ErrorWebExceptionHandler {

    private final ErrorResponseWriter errorResponseWriter;

    public GlobalGatewayExceptionHandler(ErrorResponseWriter errorResponseWriter) {
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        if (exchange.getResponse().isCommitted()) {
            return Mono.error(ex);
        }
        if (ex instanceof ResponseStatusException responseStatusException) {
            HttpStatus status = HttpStatus.valueOf(responseStatusException.getStatusCode().value());
            return errorResponseWriter.write(exchange, status, status.name(), responseStatusException.getReason() == null ? status.getReasonPhrase() : responseStatusException.getReason());
        }
        if (ex instanceof TimeoutException || ex.getCause() instanceof TimeoutException) {
            return errorResponseWriter.write(exchange, HttpStatus.GATEWAY_TIMEOUT, "GATEWAY_TIMEOUT", "Downstream service timed out");
        }
        if (ex instanceof WebClientRequestException
            || ex instanceof ConnectException
            || ex instanceof UnknownHostException
            || ex.getCause() instanceof ConnectException
            || ex.getCause() instanceof UnknownHostException) {
            return errorResponseWriter.write(exchange, HttpStatus.BAD_GATEWAY, "BAD_GATEWAY", "Downstream service unavailable");
        }
        return errorResponseWriter.write(exchange, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Unexpected gateway error");
    }
}
