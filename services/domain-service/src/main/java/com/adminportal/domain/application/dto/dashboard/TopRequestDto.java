package com.adminportal.domain.application.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TopRequestDto {
    private String requestNumber;
    private String requestedBy;
    private BigDecimal totalAmount;
    private LocalDate requestedDate;

    public TopRequestDto(String requestNumber, String requestedBy, BigDecimal totalAmount, LocalDate requestedDate) {
        this.requestNumber = requestNumber;
        this.requestedBy = requestedBy;
        this.totalAmount = totalAmount;
        this.requestedDate = requestedDate;
    }

    public String getRequestNumber() { return requestNumber; }
    public void setRequestNumber(String requestNumber) { this.requestNumber = requestNumber; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDate getRequestedDate() { return requestedDate; }
    public void setRequestedDate(LocalDate requestedDate) { this.requestedDate = requestedDate; }
}
