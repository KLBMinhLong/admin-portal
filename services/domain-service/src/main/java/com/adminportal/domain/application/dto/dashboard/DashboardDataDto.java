package com.adminportal.domain.application.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardDataDto {
    private Map<String, Long> requestsByStatus;
    private List<MonthlyCostDto> monthlyCosts;
    private List<TopRequestDto> topPendingRequests;

    // Getters and Setters
    public Map<String, Long> getRequestsByStatus() { return requestsByStatus; }
    public void setRequestsByStatus(Map<String, Long> requestsByStatus) { this.requestsByStatus = requestsByStatus; }

    public List<MonthlyCostDto> getMonthlyCosts() { return monthlyCosts; }
    public void setMonthlyCosts(List<MonthlyCostDto> monthlyCosts) { this.monthlyCosts = monthlyCosts; }

    public List<TopRequestDto> getTopPendingRequests() { return topPendingRequests; }
    public void setTopPendingRequests(List<TopRequestDto> topPendingRequests) { this.topPendingRequests = topPendingRequests; }
}
