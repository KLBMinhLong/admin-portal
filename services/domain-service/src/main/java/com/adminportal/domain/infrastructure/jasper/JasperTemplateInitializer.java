package com.adminportal.domain.infrastructure.jasper;

import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Initialize Jasper templates on application startup
 * Preloads and compiles all report templates
 */
@Component
public class JasperTemplateInitializer {

    private static final Logger log = LoggerFactory.getLogger(JasperTemplateInitializer.class);
    
    private final JasperReportCompiler jasperReportCompiler;
    
    public JasperTemplateInitializer(JasperReportCompiler jasperReportCompiler) {
        this.jasperReportCompiler = jasperReportCompiler;
    }
    
    @PostConstruct
    public void initializeTemplates() {
        log.info("Initializing Jasper report templates...");
        
        try {
            // Preload all templates
            String[] templates = {
                "RequestsByStatus",
                "RequestDetail",
                "FinancialSummary"
            };
            
            for (String template : templates) {
                try {
                    jasperReportCompiler.getCompiledReport(template);
                    log.info("✓ Template loaded: {}", template);
                } catch (Exception e) {
                    log.warn("⚠ Failed to load template: {} - {}", template, e.getMessage());
                    // Don't fail startup, templates will be loaded on first use
                }
            }
            
            log.info("Jasper template initialization completed");
            
        } catch (Exception e) {
            log.warn("Error during Jasper template initialization: {}", e.getMessage());
            // Non-blocking - reports will still work, just slower first time
        }
    }
}
