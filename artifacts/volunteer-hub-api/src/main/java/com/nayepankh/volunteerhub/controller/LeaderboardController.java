package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.dashboard.LeaderboardEntry;
import com.nayepankh.volunteerhub.service.DashboardService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Volunteer rankings and badges")
@SecurityRequirement(name = "bearerAuth")
public class LeaderboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get volunteer leaderboard ranked by hours and participation")
    public ResponseEntity<ApiResponse<List<LeaderboardEntry>>> getLeaderboard(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getLeaderboard(limit)));
    }
}
