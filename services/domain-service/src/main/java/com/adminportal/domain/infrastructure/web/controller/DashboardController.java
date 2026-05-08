package com.adminportal.domain.infrastructure.web.controller;

import com.adminportal.domain.application.dto.dashboard.DashboardDataDto;
import com.adminportal.domain.application.services.DashboardService;
import com.adminportal.domain.infrastructure.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardDataDto>> getDashboard(Authentication authentication) {
        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("request.approve") || a.getAuthority().equals("admin"));
        
        DashboardDataDto data = dashboardService.getDashboardData(username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
