package com.adminportal.domain.application.mappers.report;

import org.springframework.stereotype.Component;

/**
 * Helper class cho ReportMapper
 * Chứa các methods hỗ trợ mapping
 */
@Component
public class ReportDtoHelper {
    
    /**
     * Format currency value
     */
    public String formatCurrency(String currency) {
        if (currency == null || currency.isEmpty()) {
            return "VND";
        }
        return currency;
    }
}
