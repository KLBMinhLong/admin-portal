package com.adminportal.auth.infrastructure.web.filter;

import com.adminportal.auth.application.port.out.TokenCachePort;
import com.adminportal.auth.application.port.out.TokenRepositoryPort;
import com.adminportal.auth.domain.entity.Token;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

/**
 * x-api-key + Token validation + RBAC
 * Token khong het han - chi kiem tra flag active trong DB/Redis
 */
@Component
@RequiredArgsConstructor
public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(AuthTokenFilter.class);

    private static final String BEARER_PREFIX  = "Bearer ";
    private static final String API_KEY_HEADER = "x-api-key";
    private static final String AUTH_HEADER    = "Authorization";

    private final TokenCachePort      tokenCache;
    private final TokenRepositoryPort tokenRepository;
    // Inject API_KEY from config
    @Value("${app.api-key}")
    private String apiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // 1. x-api-key check
        String incomingKey = request.getHeader(API_KEY_HEADER);
        if (!apiKey.equals(incomingKey)) {
            log.warn("Invalid x-api-key ip={}", request.getRemoteAddr());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API key");
            return;
        }

        // 2. Extract JWT
        String authHeader = request.getHeader(AUTH_HEADER);
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing token");
            return;
        }
        String jwt = authHeader.substring(BEARER_PREFIX.length());

        // 3. Redis cache first (fast path), fallback to DB
        Token token = tokenCache.get(jwt).orElse(null);
        if (token == null) {
            token = tokenRepository.findByTokenValue(jwt).orElse(null);
            if (token != null && token.isActive()) tokenCache.put(jwt, token);
        }

        // 4. Validate active flag (token khong het han, chi revoke bang flag)
        if (token == null || !token.isActive()) {
            log.warn("Token invalid/revoked path={}", request.getServletPath());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalid or revoked");
            return;
        }

        // 5. Set Spring Security context (RBAC - permission load tu DB o layer service)
        var auth = new UsernamePasswordAuthenticationToken(
            token.getUsername(), null,
            List.of(new SimpleGrantedAuthority(token.getRole()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }
}
