# Report System Deployment & Integration Guide

## Tóm tắt

Hướng dẫn chi tiết về cách:
1. Integrate báo cáo mới vào Admin Portal Report System
2. Deploy templates mới
3. Test report generation
4. Troubleshoot report issues

---

## 1. Kiến Trúc Report System

### 1.1 Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                  API Gateway (Validate x-api-key)       │
└────────────────────────────────┬────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
         ┌──────▼──────┐             ┌────────────▼────────┐
         │ReportController           │  Permission Check   │
         │ (3 endpoints)             │  (report.view/      │
         └──────┬──────┘             │   report.export)    │
                │                    └────────────┬────────┘
                │                                 │
         ┌──────▼──────────────────────────────────┘
         │
    ┌────▼──────────────┐
    │  ReportService    │  ← Main business logic
    ├───────────────────┤
    │ - exportByStatus()│
    │ - exportDetail()  │
    │ - exportFinance() │
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │ ReportDataBuilder │  ← Map entities to report DTOs
    └────┬──────────────┘
         │
    ┌────▼─────────────────────┐
    │  JasperReportCompiler    │  ← Compile JRXML → report
    ├──────────────────────────┤
    │ - getCompiledReport()    │
    │ - clearCache()           │
    └────┬────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Report Templates (JRXML)  │
    ├──────────────────────────┤
    │ - RequestsByStatus.jrxml │
    │ - RequestDetail.jrxml    │
    │ - FinancialSummary.jrxml │
    └──────────────────────────┘
```

### 1.2 Data Flow

```
Client Request
    │
    ▼
GET /api/v1/reports/requests-by-status?status=PENDING
    │
    ▼
┌─────────────────────────────┐
│ 1. Validate x-api-key       │
│    (Gateway Filter)         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. Authorize               │
│    (Check report.view)      │
│    (From DB permissions)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. ReportController         │
│    Extract parameters       │
│    (status, user)           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. ReportService            │
│    - Query DB               │
│    - Map to DTO             │
│    - Get compiled template  │
│    - Fill with data         │
│    - Export to PDF          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 5. Return PDF               │
│    Content-Type: app/pdf    │
│    Idempotency-Key: cache   │
└─────────────────────────────┘
```

---

## 2. Adding New Report Template

### 2.1 Step-by-Step Process

#### Step 1: Create JRXML Template
**File location:** `services/domain-service/src/main/resources/reports/`

**Example:** `VendorAnalysis.jrxml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports
              http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
              name="VendorAnalysis" pageWidth="842" pageHeight="595"
              orientation="Landscape" columnWidth="802"
              leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
    
    <!-- Define parameters -->
    <parameter name="reportTitle" class="java.lang.String">
        <defaultValue>"Phân tích Nhà cung cấp"</defaultValue>
    </parameter>
    
    <!-- Define fields -->
    <field name="vendorName" class="java.lang.String"/>
    <field name="totalPurchased" class="java.math.BigDecimal"/>
    <field name="itemCount" class="java.lang.Integer"/>
    
    <!-- Page header, column header, detail, etc. -->
    <!-- ... -->
</jasperReport>
```

**Checklist for template:**
- ✅ Valid XML syntax (validate with xmllint)
- ✅ All fields defined in `<field>` tags
- ✅ All parameters defined in `<parameter>` tags
- ✅ Use `fontName="DejaVu Sans"` for Vietnamese text
- ✅ Proper date format: `pattern="dd/MM/yyyy"`
- ✅ Proper number format: `pattern="###,##0.00"`
- ✅ Margins set correctly (for printing)

#### Step 2: Create Report DTOs

**File location:** `services/domain-service/src/main/java/com/adminportal/domain/application/dtos/report/`

**Example:** `VendorAnalysisReportDto.java`
```java
package com.adminportal.domain.application.dtos.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorAnalysisReportDto {
    private String vendorName;
    private BigDecimal totalPurchased;
    private Integer itemCount;
}
```

**Guidelines:**
- Match field names exactly with JRXML template
- Use `LocalDateTime` for dates (auto-converted to `java.util.Date`)
- Use `BigDecimal` for money (not double/float)
- Use `Integer` for counts

#### Step 3: Create Repository Query Method

**File:** `domain/repositories/PurchasingRequestRepository.java`

```java
@Repository
public interface PurchasingRequestRepository extends JpaRepository<PurchasingRequest, Long> {
    // Existing methods...
    
    // New method for vendor analysis
    @Query("""
        SELECT new com.adminportal.domain.application.dtos.report.VendorAnalysisReportDto(
            v.name,
            SUM(i.totalPrice),
            COUNT(i.id)
        )
        FROM Vendor v
        JOIN v.items i
        WHERE i.request.requestedDate BETWEEN :fromDate AND :toDate
        GROUP BY v.id, v.name
        ORDER BY SUM(i.totalPrice) DESC
    """)
    List<VendorAnalysisReportDto> findVendorAnalysis(
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate
    );
}
```

#### Step 4: Add Service Method

**File:** `application/services/report/ReportService.java`

```java
@Service
public class ReportService {
    
    @Autowired
    private PurchasingRequestRepository requestRepository;
    
    @Autowired
    private JasperReportCompiler jasperReportCompiler;
    
    // New method
    public byte[] exportVendorAnalysis(LocalDate fromDate, LocalDate toDate, String username) {
        try {
            log.info("Generating vendor analysis report. From: {}, To: {}, User: {}", 
                fromDate, toDate, username);
            
            // Query data from DB
            List<VendorAnalysisReportDto> reportData = requestRepository.findVendorAnalysis(
                fromDate.atStartOfDay(),
                toDate.atTime(23, 59, 59)
            );
            
            if (reportData.isEmpty()) {
                log.warn("No vendor data found for date range: {} to {}", fromDate, toDate);
            }
            
            // Prepare parameters
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("reportTitle", "Phân tích Nhà cung cấp");
            parameters.put("reportDate", new Date());
            parameters.put("generatedBy", username);
            
            // Generate PDF
            return generatePdfFromTemplate("VendorAnalysis", reportData, parameters);
            
        } catch (Exception e) {
            log.error("Error in exportVendorAnalysis", e);
            throw new JasperReportException(
                "REPORT_GENERATION_ERROR",
                "Lỗi sinh báo cáo phân tích nhà cung cấp"
            );
        }
    }
}
```

#### Step 5: Add Controller Endpoint

**File:** `infrastructure/controller/ReportController.java`

```java
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    
    @Autowired
    private ReportService reportService;
    
    // New endpoint
    @GetMapping("/vendor-analysis")
    @PreAuthorize("hasPermission('report', 'view')")
    public ResponseEntity<byte[]> exportVendorAnalysis(
            @RequestParam(value = "fromDate") 
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromDate,
            @RequestParam(value = "toDate") 
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate toDate,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        
        try {
            log.info("[REP-04] Export vendor analysis report. From: {}, To: {}", 
                fromDate, toDate);
            
            String username = userContext.getUsername();
            byte[] pdfBytes = reportService.exportVendorAnalysis(fromDate, toDate, username);
            
            String filename = String.format("vendor-analysis_%s_to_%s.pdf", fromDate, toDate);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            if (idempotencyKey != null) {
                headers.set("Idempotency-Key", idempotencyKey);
                headers.setCacheControl("private, max-age=3600");
            }
            
            log.info("[REP-04] Report generated. Size: {} bytes", pdfBytes.length);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("[REP-04] Error generating report", e);
            throw e;
        }
    }
}
```

#### Step 6: Add Unit Tests

**File:** `application/services/report/ReportServiceTest.java`

```java
@Test
@DisplayName("Should generate vendor analysis report")
void testExportVendorAnalysis_Success() {
    // Arrange
    LocalDate fromDate = LocalDate.of(2026, 1, 1);
    LocalDate toDate = LocalDate.of(2026, 12, 31);
    
    VendorAnalysisReportDto vendor = new VendorAnalysisReportDto(
        "Vendor ABC",
        new BigDecimal("1000000"),
        10
    );
    
    when(requestRepository.findVendorAnalysis(any(), any()))
        .thenReturn(List.of(vendor));
    when(jasperReportCompiler.getCompiledReport("VendorAnalysis"))
        .thenReturn(mock(JasperReport.class));
    
    // Act
    byte[] result = reportService.exportVendorAnalysis(fromDate, toDate, "testuser");
    
    // Assert
    assertNotNull(result);
    assertTrue(result.length > 0);
    verify(requestRepository, times(1)).findVendorAnalysis(any(), any());
}
```

#### Step 7: Rebuild & Deploy

```bash
# Build project
cd admin-portal
mvn clean install

# Run tests
mvn test

# Run application
docker-compose up domain-service

# Test endpoint
curl -X GET "http://localhost:8082/api/v1/reports/vendor-analysis?fromDate=2026-01-01&toDate=2026-12-31" \
  -H "Authorization: Bearer <token>" \
  -H "x-api-key: <api-key>" \
  -H "Idempotency-Key: uuid-12345" \
  --output vendor-analysis.pdf
```

---

## 3. Testing & Validation

### 3.1 Unit Test Template

```bash
# Run specific test
mvn test -Dtest=ReportServiceTest#testExportVendorAnalysis_Success

# Run all report tests
mvn test -Dtest=ReportService*
```

### 3.2 Integration Test

```bash
# Start domain-service in Docker
docker-compose up -d domain-service

# Wait for startup (~30 seconds)
sleep 30

# Test endpoint
curl -v -X GET "http://localhost:8082/api/v1/reports/vendor-analysis?fromDate=2026-01-01&toDate=2026-12-31" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "x-api-key: your-api-key" \
  -H "Idempotency-Key: test-001" \
  --output test-report.pdf

# Check response
file test-report.pdf  # Should be: PDF document
ls -lh test-report.pdf  # Check size (should be > 1KB)
```

### 3.3 Validation Checklist

- ✅ PDF file downloaded successfully
- ✅ PDF opens in Adobe Reader / built-in viewer
- ✅ All data displays correctly
- ✅ Vietnamese text shows properly (no ???)
- ✅ Totals are correct
- ✅ Date format is correct (dd/MM/yyyy)
- ✅ Number format is correct (###,##0.00)
- ✅ Headers and footers appear
- ✅ Page numbers display
- ✅ Response time < 5 seconds

---

## 4. Database Optimization

When adding new reports, consider:

### 4.1 Query Performance
```sql
-- Add indexes for report queries
CREATE INDEX idx_request_date ON purchasing_request(requested_date);
CREATE INDEX idx_request_status ON purchasing_request(status);
CREATE INDEX idx_request_dept ON purchasing_request(department_id);

-- For vendor analysis
CREATE INDEX idx_vendor_item ON request_item(vendor_id);
CREATE INDEX idx_item_request ON request_item(request_id);
```

### 4.2 Data Volume
```java
// For large datasets, use pagination or limits
@Query("""
    SELECT ... 
    FROM ... 
    WHERE date BETWEEN :from AND :to
    LIMIT 10000  -- Prevent OOM
""")
```

### 4.3 Monitoring
```xml
<!-- Add logging in application.yml -->
logging:
  level:
    com.adminportal.domain.infrastructure.jasper: DEBUG
    com.adminportal.domain.application.services.report: DEBUG
```

---

## 5. Troubleshooting

### Issue 1: "Template not found"
```
ERROR: TEMPLATE_NOT_FOUND - Template không tìm thấy: VendorAnalysis
```
**Solution:**
- Check file exists: `src/main/resources/reports/VendorAnalysis.jrxml`
- Rebuild: `mvn clean install`
- Check logs: `grep -i "template" logs/domain-service.log`

### Issue 2: "Field not found"
```
ERROR: Error invoking expression: Cannot access field 'vendorName'
```
**Solution:**
- Add field to template:
  ```xml
  <field name="vendorName" class="java.lang.String"/>
  ```
- Match DTO property names exactly
- Case-sensitive!

### Issue 3: "PDF generation takes too long"
**Solutions:**
- Reduce data size (add WHERE clause limits)
- Add database indexes
- Cache compiled templates (already done in JasperReportCompiler)
- Monitor query time: `SELECT ... EXPLAIN ANALYZE`

### Issue 4: "Vietnamese text shows as ???"
**Solution:**
- Use font: `fontName="DejaVu Sans"`
- Check character encoding: UTF-8
- Verify DB column charset: `utf8mb4`

---

## 6. Deployment Checklist

Before pushing to Production:

- [ ] All unit tests pass: `mvn test`
- [ ] Integration tests pass: `mvn verify`
- [ ] Template compiles without errors
- [ ] All fields properly defined in template
- [ ] Data mapping DTOs created
- [ ] Service method added
- [ ] Controller endpoint added
- [ ] Permission check configured
- [ ] Logging statements added
- [ ] Error handling implemented
- [ ] Database query performance tested
- [ ] PDF output validated (Vietnamese text OK)
- [ ] API documentation updated
- [ ] Code review completed
- [ ] Merged to main branch

---

## 7. Quick Reference

### Adding a Report - Summary
```bash
1. Create JRXML template
   └─ src/main/resources/reports/NewReport.jrxml

2. Create DTO
   └─ src/main/java/.../dtos/report/NewReportDto.java

3. Add repository method
   └─ repositories/PurchasingRequestRepository.java
   └─ @Query with proper SELECT

4. Add service method
   └─ services/report/ReportService.java
   └─ exportNewReport(...) method

5. Add controller endpoint
   └─ controller/ReportController.java
   └─ @GetMapping("/new-report")

6. Add tests
   └─ test/java/.../ReportServiceTest.java
   └─ @Test void testExportNewReport_Success()

7. Test & Deploy
   └─ mvn clean install
   └─ docker-compose up domain-service
   └─ curl test endpoint
```

---

**Phiên bản:** 1.0  
**Cập nhật:** 2026-01-15  
**Tác giả:** Admin Portal Team
