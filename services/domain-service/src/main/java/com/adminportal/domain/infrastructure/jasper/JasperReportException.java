package com.adminportal.domain.infrastructure.jasper;

/**
 * Exception cho Jasper Report errors
 */
public class JasperReportException extends RuntimeException {
    private final String code;
    private final String details;
    
    public JasperReportException(String code, String message) {
        super(message);
        this.code = code;
        this.details = null;
    }
    
    public JasperReportException(String code, String message, String details) {
        super(message);
        this.code = code;
        this.details = details;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDetails() {
        return details;
    }
}
