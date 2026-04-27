package com.adminportal.domain.application.mappers.report;

import com.adminportal.domain.application.dtos.report.RequestByStatusReportDto;
import com.adminportal.domain.application.dtos.report.RequestDetailReportDto;
import com.adminportal.domain.domain.entity.ApprovalStep;
import com.adminportal.domain.domain.entity.PurchaseItem;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import org.mapstruct.Mapper;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lightweight mapper for report DTOs.
 *
 * Kept as a MapStruct mapper to satisfy the project rule, but implemented
 * with default methods so it does not depend on generated property discovery.
 */
@Mapper(componentModel = "spring")
public interface ReportMapper {

    default RequestByStatusReportDto toRequestByStatusDto(PurchasingRequest request) {
        if (request == null) {
            return null;
        }
        return new RequestByStatusReportDto(
            request.getRequestNumber(),
            request.getTitle(),
            request.getRequestedBy(),
            request.getRequestedDate().atStartOfDay(),
            request.getStatus().name(),
            request.getTotalAmount(),
            request.getCurrency(),
            formatDepartmentName(request.getDepartmentId()),
            request.getItems() == null ? 0 : request.getItems().size()
        );
    }

    default RequestDetailReportDto toRequestDetailDto(PurchasingRequest request) {
        if (request == null) {
            return null;
        }

        List<RequestDetailReportDto.ReportItemDto> items = mapItems(request.getItems());
        List<RequestDetailReportDto.ReportApprovalStepDto> approvals = mapApprovals(request.getApprovalSteps());

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
            buildItemsSummary(items),
            buildApprovalsSummary(approvals),
            items.size(),
            approvals.size()
        );
    }

    default List<RequestDetailReportDto.ReportItemDto> mapItems(List<PurchaseItem> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream()
            .map(item -> new RequestDetailReportDto.ReportItemDto(
                item.getItemName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice(),
                item.getSpecification()
            ))
            .collect(Collectors.toList());
    }

    default List<RequestDetailReportDto.ReportApprovalStepDto> mapApprovals(List<ApprovalStep> steps) {
        if (steps == null) {
            return List.of();
        }
        return steps.stream()
            .sorted((first, second) -> Integer.compare(first.getStepOrder(), second.getStepOrder()))
            .map(step -> new RequestDetailReportDto.ReportApprovalStepDto(
                step.getStepOrder(),
                step.getRoleName(),
                step.getApprover(),
                step.getStatus().name(),
                step.getCompletedAt() == null ? null : LocalDateTime.ofInstant(step.getCompletedAt(), ZoneId.systemDefault()),
                step.getComment()
            ))
            .collect(Collectors.toList());
    }

    default String buildItemsSummary(List<RequestDetailReportDto.ReportItemDto> items) {
        if (items == null || items.isEmpty()) {
            return "Không có dữ liệu hàng hóa";
        }
        return items.stream()
            .map(item -> "- " + item.getItemName() + " | SL: " + item.getQuantity() + " | Đơn giá: " + item.getUnitPrice() + " | Thành tiền: " + item.getTotalPrice())
            .collect(Collectors.joining("\n"));
    }

    default String buildApprovalsSummary(List<RequestDetailReportDto.ReportApprovalStepDto> approvals) {
        if (approvals == null || approvals.isEmpty()) {
            return "Chưa có bước phê duyệt";
        }
        return approvals.stream()
            .map(step -> "- Bước " + step.getStepNumber() + " | " + step.getApproverRole() + " | " + step.getApproverUser() + " | " + step.getStatus())
            .collect(Collectors.joining("\n"));
    }

    default String formatDepartmentName(Long departmentId) {
        return departmentId == null ? "N/A" : "Phòng " + departmentId;
    }
}
