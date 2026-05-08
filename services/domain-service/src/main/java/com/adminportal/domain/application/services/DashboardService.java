package com.adminportal.domain.application.services;

import com.adminportal.domain.application.dto.dashboard.DashboardDataDto;
import com.adminportal.domain.application.dto.dashboard.MonthlyCostDto;
import com.adminportal.domain.application.dto.dashboard.TopRequestDto;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.application.port.out.PurchasingRequestPort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final PurchasingRequestPort requestRepository;

    public DashboardService(PurchasingRequestPort requestRepository) {
        this.requestRepository = requestRepository;
    }

    public DashboardDataDto getDashboardData(String username, boolean isAdmin) {
        DashboardDataDto dto = new DashboardDataDto();
        int currentYear = LocalDate.now().getYear();

        List<Object[]> statusCountsObj;
        List<Object[]> monthlyCostsObj;
        List<PurchasingRequest> topRequests;

        if (isAdmin) {
            statusCountsObj = requestRepository.countRequestsByStatus();
            monthlyCostsObj = requestRepository.sumTotalAmountByMonthInYear(currentYear);
            topRequests = requestRepository.findTopPendingRequests(PageRequest.of(0, 5));
        } else {
            statusCountsObj = requestRepository.countRequestsByStatusForUser(username);
            monthlyCostsObj = requestRepository.sumTotalAmountByMonthInYearForUser(currentYear, username);
            topRequests = requestRepository.findTopPendingRequestsForUser(username, PageRequest.of(0, 5));
        }

        // 1. Map Status
        Map<String, Long> statusMap = new HashMap<>();
        for (Object[] row : statusCountsObj) {
            String status = row[0] != null ? row[0].toString() : "UNKNOWN";
            Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            statusMap.put(status, count);
        }
        dto.setRequestsByStatus(statusMap);

        // 2. Map Monthly
        List<MonthlyCostDto> monthlyCosts = new ArrayList<>();
        // Initialize 12 months with 0
        for (int i = 1; i <= 12; i++) {
            monthlyCosts.add(new MonthlyCostDto(i, BigDecimal.ZERO));
        }
        for (Object[] row : monthlyCostsObj) {
            int month = row[0] != null ? ((Number) row[0]).intValue() : 1;
            BigDecimal total = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            monthlyCosts.get(month - 1).setTotalCost(total);
        }
        dto.setMonthlyCosts(monthlyCosts);

        // 3. Map Top requests
        List<TopRequestDto> topDtoList = topRequests.stream()
                .map(r -> new TopRequestDto(r.getRequestNumber(), r.getRequestedBy(), r.getTotalAmount(), r.getRequestedDate()))
                .collect(Collectors.toList());
        dto.setTopPendingRequests(topDtoList);

        return dto;
    }
}
