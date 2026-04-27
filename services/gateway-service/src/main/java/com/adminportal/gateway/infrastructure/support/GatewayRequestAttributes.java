package com.adminportal.gateway.infrastructure.support;

public final class GatewayRequestAttributes {

    public static final String TRACE_ID = "traceId";
    public static final String SPAN_ID = "spanId";
    public static final String USERNAME = "authenticatedUsername";
    public static final String USER_ROLE = "authenticatedRole";
    public static final String USER_ID = "authenticatedUserId";
    public static final String TOKEN_JTI = "tokenJti";

    private GatewayRequestAttributes() {
    }
}
