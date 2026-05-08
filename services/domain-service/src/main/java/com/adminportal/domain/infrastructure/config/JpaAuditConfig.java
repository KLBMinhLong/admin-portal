package com.adminportal.domain.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing
public class JpaAuditConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            SecurityContext context = SecurityContextHolder.getContext();
            if (context == null) return Optional.of("SYSTEM");
            
            Authentication auth = context.getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return Optional.of("SYSTEM");
            
            return Optional.ofNullable(auth.getName());
        };
    }
}
