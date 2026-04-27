package com.adminportal.domain.infrastructure.jasper;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;

/**
 * Jasper Reports Configuration
 * 
 * Setup:
 * - Template compilation caching
 * - Resource loading
 * - Error handling
 */
@Configuration
public class JasperReportsConfiguration {
    
    /**
     * Bean để compile và cache Jasper templates
     */
    @Bean
    @Scope(value = "singleton", proxyMode = ScopedProxyMode.NO)
    public JasperReportCompiler jasperReportCompiler() {
        return new JasperReportCompiler();
    }
    
    /**
     * Initialize templates on startup (optional - for eager loading)
     * Uncomment to preload all templates when application starts
     */
    @Bean
    public JasperTemplateInitializer jasperTemplateInitializer(JasperReportCompiler compiler) {
        return new JasperTemplateInitializer(compiler);
    }
}
