package com.adminportal.domain.infrastructure.controller;

import com.adminportal.domain.application.services.report.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * REST Controller cho Report API
 * 
 * 3 endpoints:
 * 1. GET /api/v1/reports/requests-by-status - Danh sách YC theo trạng thái
 * 2. GET /api/v1/reports/request-detail/{id} - Chi tiết một YC
 * 3. GET /api/v1/reports/financial-summary - Tóm tắt tài chính
 * 
 * Yêu cầu:
 * - Header: x-api-key (validation trước JWT)
 * - Header: Idempotency-Key (UUID, cho caching response)
 * - Permission check: report.view hoặc report.export (từ DB)
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    
    @Autowired
    private ReportService reportService;
    
    /**
     * Endpoint 1: Export danh sách yêu cầu theo trạng thái
     * 
     * GET /api/v1/reports/requests-by-status?status=PENDING
     * 
     * @param status Trạng thái yêu cầu (PENDING, APPROVED, REJECTED, etc.)
     * @param idempotencyKey Idempotency key để tránh duplicate request
     * @return PDF file
     */
    @GetMapping("/requests-by-status")
    @PreAuthorize("hasPermission('report', 'view')")
    public ResponseEntity<byte[]> exportRequestsByStatus(
            @RequestParam(value = "status", required = false) String status,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            Authentication authentication) {
        
        try {
            log.info("[REP-01] Export requests by status report. Status: {}, Key: {}", 
                status, idempotencyKey);
            
            // Get current user
            String username = resolveUsername(authentication);
            
            // Generate PDF
            byte[] pdfBytes = reportService.exportRequestsByStatus(status, username);
            
            // Prepare response
            String filename = String.format("requests-by-status_%s.pdf", LocalDate.now());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            // Add cache header if idempotency key provided
            if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
                headers.set("Idempotency-Key", idempotencyKey);
                // Cache for 1 hour (3600 seconds)
                headers.setCacheControl("private, max-age=3600");
            }
            
            log.info("[REP-01] Report generated successfully. Size: {} bytes, Filename: {}", 
                pdfBytes.length, filename);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("[REP-01] Error generating report", e);
            throw e;
        }
    }
    
    /**
     * Endpoint 2: Export chi tiết một yêu cầu
     * 
     * GET /api/v1/reports/request-detail/{id}
     * 
     * @param requestId ID của yêu cầu
     * @param idempotencyKey Idempotency key
     * @return PDF file
     */
    @GetMapping("/request-detail/{id}")
    @PreAuthorize("hasPermission('report', 'view')")
    public ResponseEntity<byte[]> exportRequestDetail(
            @PathVariable(value = "id") Long requestId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            Authentication authentication) {
        
        try {
            log.info("[REP-02] Export request detail report. RequestId: {}, Key: {}", 
                requestId, idempotencyKey);
            
            // Get current user
            String username = resolveUsername(authentication);
            
            // Generate PDF
            byte[] pdfBytes = reportService.exportRequestDetail(requestId, username);
            
            // Prepare response
            String filename = String.format("request-detail_%d.pdf", requestId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            // Add cache header if idempotency key provided
            if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
                headers.set("Idempotency-Key", idempotencyKey);
                // Cache for 1 hour
                headers.setCacheControl("private, max-age=3600");
            }
            
            log.info("[REP-02] Report generated successfully. Size: {} bytes, Filename: {}", 
                pdfBytes.length, filename);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("[REP-02] Error generating report", e);
            throw e;
        }
    }
    
    /**
     * Endpoint 3: Export báo cáo tóm tắt tài chính
     * 
     * GET /api/v1/reports/financial-summary?fromDate=2026-01-01&toDate=2026-12-31
     * 
     * @param fromDate Ngày bắt đầu (format: yyyy-MM-dd)
     * @param toDate Ngày kết thúc (format: yyyy-MM-dd)
     * @param idempotencyKey Idempotency key
     * @return PDF file
     */
    @GetMapping("/financial-summary")
    @PreAuthorize("hasPermission('report', 'view')")
    public ResponseEntity<byte[]> exportFinancialSummary(
            @RequestParam(value = "fromDate", required = false) 
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) 
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate toDate,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            Authentication authentication) {
        
        try {
            // Default to current year if not provided
            LocalDate from = fromDate != null ? fromDate : LocalDate.now().withDayOfYear(1);
            LocalDate to = toDate != null ? toDate : LocalDate.now();
            
            log.info("[REP-03] Export financial summary report. From: {}, To: {}, Key: {}", 
                from, to, idempotencyKey);
            
            // Get current user
            String username = resolveUsername(authentication);
            
            // Generate PDF
            byte[] pdfBytes = reportService.exportFinancialSummary(from, to, username);
            
            // Prepare response
            String filename = String.format("financial-summary_%s_to_%s.pdf", from, to);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            // Add cache header if idempotency key provided
            if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
                headers.set("Idempotency-Key", idempotencyKey);
                // Cache for 1 hour
                headers.setCacheControl("private, max-age=3600");
            }
            
            log.info("[REP-03] Report generated successfully. Size: {} bytes, Filename: {}", 
                pdfBytes.length, filename);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("[REP-03] Error generating report", e);
            throw e;
        }
    }

    private String resolveUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return "SYSTEM";
        }
        return authentication.getName();
    }
}
