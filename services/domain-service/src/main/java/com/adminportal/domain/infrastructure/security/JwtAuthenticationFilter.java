package com.adminportal.domain.infrastructure.security;

import com.adminportal.domain.application.port.out.ActiveTokenQueryPort;
import com.adminportal.domain.application.port.out.UserAccessQueryPort;
import com.adminportal.domain.application.port.out.UserAccessQueryPort.UserAccessView;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;
    private final ActiveTokenQueryPort activeTokenQueryPort;
    private final UserAccessQueryPort userAccessQueryPort;

    public JwtAuthenticationFilter(JwtProvider jwtProvider,
                                   ActiveTokenQueryPort activeTokenQueryPort,
                                   UserAccessQueryPort userAccessQueryPort) {
        this.jwtProvider = jwtProvider;
        this.activeTokenQueryPort = activeTokenQueryPort;
        this.userAccessQueryPort = userAccessQueryPort;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/actuator/")
            || uri.startsWith("/engine-rest/")
            || uri.startsWith("/camunda/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing token");
            return;
        }

        JwtProvider.JwtPrincipal principal;
        try {
            principal = jwtProvider.parse(authorization.substring(BEARER_PREFIX.length()));
        } catch (RuntimeException exception) {
            log.warn("JWT parse failed path={}", request.getRequestURI());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalid or revoked");
            return;
        }

        if (!activeTokenQueryPort.isActive(principal.jti())) {
            log.warn("Inactive token jti={} path={}", principal.jti(), request.getRequestURI());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalid or revoked");
            return;
        }

        UserAccessView userAccess = userAccessQueryPort.findActiveUserAccess(principal.username()).orElse(null);
        if (userAccess == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User inactive or not found");
            return;
        }

        Set<String> authorities = new LinkedHashSet<>();
        authorities.addAll(userAccess.permissionCodes());
        authorities.addAll(userAccess.roleCodes().stream()
            .map(roleCode -> "ROLE_" + roleCode)
            .collect(Collectors.toCollection(LinkedHashSet::new)));

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            userAccess.username(),
            null,
            authorities.stream().map(SimpleGrantedAuthority::new).toList()
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
