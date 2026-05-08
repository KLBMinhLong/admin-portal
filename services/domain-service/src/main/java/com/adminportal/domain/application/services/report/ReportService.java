package com.adminportal.domain.application.services.report;

import com.adminportal.domain.application.dtos.report.FinancialSummaryReportDto;
import com.adminportal.domain.application.dtos.report.RequestByStatusReportDto;
import com.adminportal.domain.application.dtos.report.RequestDetailReportDto;
import com.adminportal.domain.application.port.out.PurchasingRequestPort;
import com.adminportal.domain.domain.entity.ApprovalStep;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.entity.RequestStatus;
import com.adminportal.domain.infrastructure.jasper.JasperReportCompiler;
import com.adminportal.domain.infrastructure.jasper.JasperReportException;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service để generate Jasper Reports cho Purchasing Request.
 */
@Service
@Transactional(readOnly = true)
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final PurchasingRequestPort requestRepository;

    private final JasperReportCompiler jasperReportCompiler;

    public ReportService(PurchasingRequestPort requestRepository, JasperReportCompiler jasperReportCompiler) {
        this.requestRepository = requestRepository;
        this.jasperReportCompiler = jasperReportCompiler;
    }

    public byte[] exportRequestsByStatus(String status, String username) {
        try {
            log.info("Generating requests by status report. Status: {}, User: {}", status, username);

            List<PurchasingRequest> requests = requestRepository.findAll();
            if (status != null && !status.isBlank()) {
                RequestStatus filterStatus = parseStatus(status);
                requests = requests.stream()
                    .filter(request -> request.getStatus() == filterStatus)
                    .collect(Collectors.toList());
            }

            List<RequestByStatusReportDto> reportData = requests.stream()
                .map(this::mapToRequestByStatusDto)
                .sorted(Comparator.comparing(RequestByStatusReportDto::getStatus)
                    .thenComparing(RequestByStatusReportDto::getRequestedDate, Comparator.reverseOrder()))
                .collect(Collectors.toList());

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("reportTitle", "Danh sách Yêu cầu Mua sắm");
            parameters.put("reportDate", new Date());
            parameters.put("generatedBy", username);
            parameters.put("filterStatus", status != null ? status : "Tất cả");

            return generatePdfFromTemplate("RequestsByStatus", reportData, parameters);
        } catch (JasperReportException e) {
            log.error("Jasper error in exportRequestsByStatus: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in exportRequestsByStatus", e);
            throw new JasperReportException("REPORT_GENERATION_ERROR", "Lỗi sinh báo cáo danh sách YC: " + e.getMessage());
        }
    }

    public byte[] exportRequestDetail(Long requestId, String username) {
        try {
            log.info("Generating request detail report. RequestId: {}, User: {}", requestId, username);

            PurchasingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

            RequestDetailReportDto reportData = mapToRequestDetailDto(request);

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("reportTitle", "Chi tiết Yêu cầu Mua sắm");
            parameters.put("reportDate", new Date());
            parameters.put("generatedBy", username);

            return generatePdfFromTemplate("RequestDetail", List.of(reportData), parameters);
        } catch (JasperReportException e) {
            log.error("Jasper error in exportRequestDetail: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in exportRequestDetail", e);
            throw new JasperReportException("REPORT_GENERATION_ERROR", "Lỗi sinh báo cáo chi tiết YC: " + e.getMessage());
        }
    }

    public byte[] exportFinancialSummary(LocalDate fromDate, LocalDate toDate, String username) {
        try {
            log.info("Generating financial summary report. From: {}, To: {}, User: {}", fromDate, toDate, username);

            List<PurchasingRequest> requests = requestRepository.findAll().stream()
                .filter(request -> {
                    LocalDate requestDate = request.getRequestedDate();
                    return !requestDate.isBefore(fromDate) && !requestDate.isAfter(toDate);
                })
                .collect(Collectors.toList());

            Map<String, Map<RequestStatus, List<PurchasingRequest>>> grouped = requests.stream()
                .collect(Collectors.groupingBy(
                    request -> formatDepartmentName(request.getDepartmentId()),
                    Collectors.groupingBy(PurchasingRequest::getStatus)
                ));

            List<FinancialSummaryReportDto> reportData = new ArrayList<>();
            grouped.forEach((departmentName, statusMap) -> {
                statusMap.forEach((requestStatus, requestGroup) -> {
                    BigDecimal total = requestGroup.stream()
                        .map(PurchasingRequest::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal average = requestGroup.isEmpty()
                        ? BigDecimal.ZERO
                        : total.divide(BigDecimal.valueOf(requestGroup.size()), 2, java.math.RoundingMode.HALF_UP);

                    int itemCount = requestGroup.stream().mapToInt(request -> request.getItems().size()).sum();

                    reportData.add(new FinancialSummaryReportDto(
                        departmentName,
                        requestStatus.name(),
                        requestGroup.size(),
                        total,
                        average,
                        requestGroup.get(0).getCurrency(),
                        itemCount
                    ));
                });
            });

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("reportTitle", "Tóm tắt Tài chính Yêu cầu Mua sắm");
            parameters.put("reportDate", new Date());
            parameters.put("generatedBy", username);
            parameters.put("fromDate", java.sql.Date.valueOf(fromDate));
            parameters.put("toDate", java.sql.Date.valueOf(toDate));

            return generatePdfFromTemplate("FinancialSummary", reportData, parameters);
        } catch (JasperReportException e) {
            log.error("Jasper error in exportFinancialSummary: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in exportFinancialSummary", e);
            throw new JasperReportException("REPORT_GENERATION_ERROR", "Lỗi sinh báo cáo tài chính: " + e.getMessage());
        }
    }

    private byte[] generatePdfFromTemplate(String templateName, List<?> data, Map<String, Object> parameters) {
        try {
            JasperReport jasperReport = jasperReportCompiler.getCompiledReport(templateName);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
            byte[] pdfBytes = outputStream.toByteArray();

            log.info("PDF generated successfully. Size: {} bytes", pdfBytes.length);
            return pdfBytes;
        } catch (Exception e) {
            log.error("Error generating PDF from template: {}", templateName, e);
            throw new JasperReportException("PDF_GENERATION_ERROR", "Lỗi xuất PDF: " + e.getMessage());
        }
    }

    private RequestByStatusReportDto mapToRequestByStatusDto(PurchasingRequest request) {
        return new RequestByStatusReportDto(
            request.getRequestNumber(),
            request.getTitle(),
            request.getRequestedBy(),
            request.getRequestedDate().atStartOfDay(),
            request.getStatus().name(),
            request.getTotalAmount(),
            request.getCurrency(),
            formatDepartmentName(request.getDepartmentId()),
            request.getItems().size()
        );
    }

    private RequestDetailReportDto mapToRequestDetailDto(PurchasingRequest request) {
        List<RequestDetailReportDto.ReportItemDto> items = request.getItems().stream()
            .map(item -> new RequestDetailReportDto.ReportItemDto(
                item.getItemName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice(),
                item.getSpecification()
            ))
            .collect(Collectors.toList());

        List<RequestDetailReportDto.ReportApprovalStepDto> approvals = request.getApprovalSteps().stream()
            .sorted(Comparator.comparingInt(ApprovalStep::getStepOrder))
            .map(step -> new RequestDetailReportDto.ReportApprovalStepDto(
                step.getStepOrder(),
                step.getRoleName(),
                step.getApprover(),
                step.getStatus().name(),
                step.getCompletedAt() == null ? null : LocalDateTime.ofInstant(step.getCompletedAt(), ZoneId.systemDefault()),
                step.getComment()
            ))
            .collect(Collectors.toList());

        String itemsSummary = items.isEmpty()
            ? "Không có dữ liệu hàng hóa"
            : items.stream()
                .map(item -> String.format("- %s | SL: %d | Đơn giá: %s | Thành tiền: %s",
                    item.getItemName(), item.getQuantity(), item.getUnitPrice(), item.getTotalPrice()))
                .collect(Collectors.joining("\n"));

        String approvalsSummary = approvals.isEmpty()
            ? "Chưa có bước phê duyệt"
            : approvals.stream()
                .map(step -> String.format("- Bước %d | %s | %s | %s",
                    step.getStepNumber(), step.getApproverRole(), step.getApproverUser(), step.getStatus()))
                .collect(Collectors.joining("\n"));

        return new RequestDetailReportDto(
            request.getRequestNumber(),
            request.getTitle(),
            request.getDescription(),
            request.getStatus().name(),
            request.getRequestedBy(),
            request.getRequestedDate().atStartOfDay(),
            formatDepartmentName(request.getDepartmentId()),
            request.getCostCenter(),
            request.getTotalAmount(),
            request.getCurrency(),
            items,
            approvals,
            itemsSummary,
            approvalsSummary,
            items.size(),
            approvals.size()
        );
    }

    private RequestStatus parseStatus(String status) {
        try {
            return RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            if ("PENDING".equalsIgnoreCase(status)) {
                return RequestStatus.PENDING_APPROVAL;
            }
            throw new JasperReportException("INVALID_STATUS", "Trạng thái không hợp lệ: " + status);
        }
    }

    private String formatDepartmentName(Long departmentId) {
        return departmentId == null ? "N/A" : "Phòng " + departmentId;
    }

    @SuppressWarnings("unused")
    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return "SYSTEM";
        }
        return authentication.getName();
    }
}
