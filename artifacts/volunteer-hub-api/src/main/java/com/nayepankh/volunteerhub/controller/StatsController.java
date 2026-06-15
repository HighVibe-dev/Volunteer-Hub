package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.dashboard.PublicStatsResponse;
import com.nayepankh.volunteerhub.service.DashboardService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
@Tag(name = "Stats", description = "Public platform statistics (no auth required)")
public class StatsController {

    private final DashboardService dashboardService;

    @GetMapping("/public")
    @Operation(summary = "Get public platform-wide statistics")
    public ResponseEntity<ApiResponse<PublicStatsResponse>> getPublicStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getPublicStats()));
    }
}
