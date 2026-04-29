package com.adminportal.domain.application.dto.dashboard;

import java.math.BigDecimal;

public class MonthlyCostDto {
    private int month;
    private BigDecimal totalCost;

    public MonthlyCostDto(int month, BigDecimal totalCost) {
        this.month = month;
        this.totalCost = totalCost;
    }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }
    public BigDecimal getTotalCost() { return totalCost; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
}
