package com.adminportal.domain.application.dtos.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class RequestDetailReportDto {

    private String requestNumber;
    private String title;
    private String description;
    private String status;
    private String requestedBy;
    private LocalDateTime requestedDate;
    private String departmentName;
    private String costCenter;
    private BigDecimal totalAmount;
    private String currency;
    private List<ReportItemDto> items;
    private List<ReportApprovalStepDto> approvals;
    private String itemsSummary;
    private String approvalsSummary;
    private Integer itemCount;
    private Integer approvalCount;

    public RequestDetailReportDto() {
    }

    public RequestDetailReportDto(String requestNumber, String title, String description, String status, String requestedBy, LocalDateTime requestedDate, String departmentName, String costCenter, BigDecimal totalAmount, String currency, List<ReportItemDto> items, List<ReportApprovalStepDto> approvals, String itemsSummary, String approvalsSummary, Integer itemCount, Integer approvalCount) {
        this.requestNumber = requestNumber;
        this.title = title;
        this.description = description;
        this.status = status;
        this.requestedBy = requestedBy;
        this.requestedDate = requestedDate;
        this.departmentName = departmentName;
        this.costCenter = costCenter;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.items = items;
        this.approvals = approvals;
        this.itemsSummary = itemsSummary;
        this.approvalsSummary = approvalsSummary;
        this.itemCount = itemCount;
        this.approvalCount = approvalCount;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public LocalDateTime getRequestedDate() {
        return requestedDate;
    }

    public void setRequestedDate(LocalDateTime requestedDate) {
        this.requestedDate = requestedDate;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getCostCenter() {
        return costCenter;
    }

    public void setCostCenter(String costCenter) {
        this.costCenter = costCenter;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public List<ReportItemDto> getItems() {
        return items;
    }

    public void setItems(List<ReportItemDto> items) {
        this.items = items;
    }

    public List<ReportApprovalStepDto> getApprovals() {
        return approvals;
    }

    public void setApprovals(List<ReportApprovalStepDto> approvals) {
        this.approvals = approvals;
    }

    public String getItemsSummary() {
        return itemsSummary;
    }

    public void setItemsSummary(String itemsSummary) {
        this.itemsSummary = itemsSummary;
    }

    public String getApprovalsSummary() {
        return approvalsSummary;
    }

    public void setApprovalsSummary(String approvalsSummary) {
        this.approvalsSummary = approvalsSummary;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }

    public Integer getApprovalCount() {
        return approvalCount;
    }

    public void setApprovalCount(Integer approvalCount) {
        this.approvalCount = approvalCount;
    }

    public static class ReportItemDto {
        private String itemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String specification;

        public ReportItemDto() {
        }

        public ReportItemDto(String itemName, Integer quantity, BigDecimal unitPrice, BigDecimal totalPrice, String specification) {
            this.itemName = itemName;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.totalPrice = totalPrice;
            this.specification = specification;
        }

        public String getItemName() {
            return itemName;
        }

        public void setItemName(String itemName) {
            this.itemName = itemName;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
        }

        public BigDecimal getTotalPrice() {
            return totalPrice;
        }

        public void setTotalPrice(BigDecimal totalPrice) {
            this.totalPrice = totalPrice;
        }

        public String getSpecification() {
            return specification;
        }

        public void setSpecification(String specification) {
            this.specification = specification;
        }
    }

    public static class ReportApprovalStepDto {
        private Integer stepNumber;
        private String approverRole;
        private String approverUser;
        private String status;
        private LocalDateTime approvedAt;
        private String remarks;

        public ReportApprovalStepDto() {
        }

        public ReportApprovalStepDto(Integer stepNumber, String approverRole, String approverUser, String status, LocalDateTime approvedAt, String remarks) {
            this.stepNumber = stepNumber;
            this.approverRole = approverRole;
            this.approverUser = approverUser;
            this.status = status;
            this.approvedAt = approvedAt;
            this.remarks = remarks;
        }

        public Integer getStepNumber() {
            return stepNumber;
        }

        public void setStepNumber(Integer stepNumber) {
            this.stepNumber = stepNumber;
        }

        public String getApproverRole() {
            return approverRole;
        }

        public void setApproverRole(String approverRole) {
            this.approverRole = approverRole;
        }

        public String getApproverUser() {
            return approverUser;
        }

        public void setApproverUser(String approverUser) {
            this.approverUser = approverUser;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getApprovedAt() {
            return approvedAt;
        }

        public void setApprovedAt(LocalDateTime approvedAt) {
            this.approvedAt = approvedAt;
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }
}
