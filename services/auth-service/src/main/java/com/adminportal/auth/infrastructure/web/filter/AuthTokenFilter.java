package com.adminportal.auth.infrastructure.web.filter;

import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.application.services.RuntimePermissionService;
import com.adminportal.auth.domain.entity.Token;
import com.adminportal.auth.infrastructure.security.JwtProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Set;

/**
 * x-api-key + Token validation + RBAC
 * Token khong het han - chi kiem tra flag active trong DB/Redis
 */
@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(AuthTokenFilter.class);

    private static final String BEARER_PREFIX  = "Bearer ";
    private static final String API_KEY_HEADER = "x-api-key";
    private static final String AUTH_HEADER    = "Authorization";
    private static final Set<String> PUBLIC_PATHS = Set.of(
        "/api/v1/auth/login",
        "/api/v1/auth/verify-2fa",
        "/api/v1/auth/register",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password"
    );

    private final TokenCachePort      tokenCache;
    private final TokenRepositoryPort tokenRepository;
    private final JwtProvider jwtProvider;
    private final RuntimePermissionService runtimePermissionService;

    public AuthTokenFilter(TokenCachePort tokenCache,
                           TokenRepositoryPort tokenRepository,
                           JwtProvider jwtProvider,
                           RuntimePermissionService runtimePermissionService) {
        this.tokenCache = tokenCache;
        this.tokenRepository = tokenRepository;
        this.jwtProvider = jwtProvider;
        this.runtimePermissionService = runtimePermissionService;
    }

    // Inject API_KEY from config
    @Value("${app.api-key}")
    private String apiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String requestUri = request.getRequestURI();

        if (requestUri.startsWith("/actuator/health")) {
            chain.doFilter(request, response);
            return;
        }

        // 1. x-api-key check
        String incomingKey = request.getHeader(API_KEY_HEADER);
        if (incomingKey == null || !apiKey.equals(incomingKey)) {
            log.warn("Invalid x-api-key ip={}", request.getRemoteAddr());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API key");
            return;
        }

        if (PUBLIC_PATHS.contains(requestUri)) {
            chain.doFilter(request, response);
            return;
        }

        // 2. Extract JWT
        String authHeader = request.getHeader(AUTH_HEADER);
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing token");
            return;
        }
        String jwt = authHeader.substring(BEARER_PREFIX.length());

        JwtProvider.JwtPrincipal principal;
        try {
            principal = jwtProvider.parse(jwt);
        } catch (RuntimeException exception) {
            log.warn("JWT validation failed path={}", request.getServletPath());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalid or revoked");
            return;
        }

        // 3. Redis cache first (fast path), fallback to DB
        Token token = tokenCache.get(principal.jti()).orElse(null);
        if (token == null) {
            token = tokenRepository.findByTokenJti(principal.jti()).orElse(null);
            if (token != null && token.isActive()) {
                tokenCache.put(token);
            }
        }

        // 4. Validate active flag (token khong het han, chi revoke bang flag)
        if (token == null || !token.isActive()) {
            log.warn("Token invalid/revoked path={}", request.getServletPath());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalid or revoked");
            return;
        }

        // 5. Set Spring Security context (RBAC - permission load tu DB o layer service)
        Set<String> authoritiesSet = runtimePermissionService.getAllAuthorities(principal.username());
        List<SimpleGrantedAuthority> authorities = authoritiesSet.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());

        var auth = new UsernamePasswordAuthenticationToken(
            principal.username(), null,
            authorities
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }
}
