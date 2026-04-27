package com.adminportal.domain.infrastructure.jasper;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperReport;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Component để compile Jasper templates từ JRXML thành JasperReport objects
 */
@Component
public class JasperReportCompiler {
    
    private final Map<String, JasperReport> compiledReports = new HashMap<>();
    
    /**
     * Lấy compiled report từ cache hoặc compile từ JRXML file
     */
    public JasperReport getCompiledReport(String templateName) {
        return compiledReports.computeIfAbsent(templateName, name -> {
            try {
                InputStream inputStream = getClass()
                    .getResourceAsStream("/reports/" + name + ".jrxml");
                
                if (inputStream == null) {
                    throw new JasperReportException(
                        "TEMPLATE_NOT_FOUND",
                        "Template không tìm thấy: " + name
                    );
                }
                
                return JasperCompileManager.compileReport(inputStream);
            } catch (Exception e) {
                throw new JasperReportException(
                    "COMPILE_ERROR",
                    "Lỗi compile template: " + name + " - " + e.getMessage()
                );
            }
        });
    }
    
    /**
     * Clear cache khi template thay đổi
     */
    public void clearCache(String templateName) {
        compiledReports.remove(templateName);
    }
    
    /**
     * Clear tất cả cache
     */
    public void clearAllCache() {
        compiledReports.clear();
    }
}
