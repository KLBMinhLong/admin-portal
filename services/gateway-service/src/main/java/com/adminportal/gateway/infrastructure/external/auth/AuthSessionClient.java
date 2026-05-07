package com.adminportal.gateway.infrastructure.external.auth;

import reactor.core.publisher.Mono;

public interface AuthSessionClient {
    Mono<Void> validate(String bearerToken, String traceId, String spanId);

    class InvalidTokenException extends RuntimeException {
        public InvalidTokenException() {
            super("Token invalid or revoked");
        }
    }

    class DownstreamAuthException extends RuntimeException {
        public DownstreamAuthException(String message) {
            super(message);
        }

        public DownstreamAuthException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
