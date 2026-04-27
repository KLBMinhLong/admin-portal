package com.adminportal.domain.application.dtos.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RequestByStatusReportDto {

    private String requestNumber;
    private String title;
    private String requestedBy;
    private LocalDateTime requestedDate;
    private String status;
    private BigDecimal totalAmount;
    private String currency;
    private String departmentName;
    private Integer itemCount;

    public RequestByStatusReportDto() {
    }

    public RequestByStatusReportDto(String requestNumber, String title, String requestedBy, LocalDateTime requestedDate, String status, BigDecimal totalAmount, String currency, String departmentName, Integer itemCount) {
        this.requestNumber = requestNumber;
        this.title = title;
        this.requestedBy = requestedBy;
        this.requestedDate = requestedDate;
        this.status = status;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.departmentName = departmentName;
        this.itemCount = itemCount;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }
}
