package com.adminportal.domain.application.dtos.report;

import java.math.BigDecimal;

public class FinancialSummaryReportDto {

    private String departmentName;
    private String status;
    private Integer requestCount;
    private BigDecimal totalAmount;
    private BigDecimal averageAmount;
    private String currency;
    private Integer itemCount;

    public FinancialSummaryReportDto() {
    }

    public FinancialSummaryReportDto(String departmentName, String status, Integer requestCount, BigDecimal totalAmount, BigDecimal averageAmount, String currency, Integer itemCount) {
        this.departmentName = departmentName;
        this.status = status;
        this.requestCount = requestCount;
        this.totalAmount = totalAmount;
        this.averageAmount = averageAmount;
        this.currency = currency;
        this.itemCount = itemCount;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getRequestCount() {
        return requestCount;
    }

    public void setRequestCount(Integer requestCount) {
        this.requestCount = requestCount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getAverageAmount() {
        return averageAmount;
    }

    public void setAverageAmount(BigDecimal averageAmount) {
        this.averageAmount = averageAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }
}
