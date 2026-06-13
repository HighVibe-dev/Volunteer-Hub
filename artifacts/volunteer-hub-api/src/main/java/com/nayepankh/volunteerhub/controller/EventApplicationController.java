package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.event.EventApplicationResponse;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.EventApplicationService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/event-applications")
@RequiredArgsConstructor
@Tag(name = "Event Applications", description = "Apply to events and manage approvals")
@SecurityRequirement(name = "bearerAuth")
public class EventApplicationController {

    private final EventApplicationService applicationService;
    private final JwtUtil jwtUtil;

    @PostMapping
    @Operation(summary = "Volunteer applies to an event")
    public ResponseEntity<ApiResponse<EventApplicationResponse>> apply(
            @RequestParam Long eventId,
            HttpServletRequest req) {
        Long userId = extractUserId(req);
        return ResponseEntity.ok(ApiResponse.success("Application submitted",
                applicationService.apply(userId, eventId)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Approve or reject an application")
    public ResponseEntity<ApiResponse<EventApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            HttpServletRequest req) {
        Long coordinatorId = extractUserId(req);
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                applicationService.updateStatus(id, status, coordinatorId)));
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Get all applications for an event")
    public ResponseEntity<ApiResponse<Page<EventApplicationResponse>>> byEvent(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.getApplicationsByEvent(eventId, PageRequest.of(page, size))));
    }

    @GetMapping("/volunteer/{volunteerId}")
    @Operation(summary = "Get all applications for a volunteer")
    public ResponseEntity<ApiResponse<Page<EventApplicationResponse>>> byVolunteer(
            @PathVariable Long volunteerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.getApplicationsByVolunteer(volunteerId, PageRequest.of(page, size))));
    }

    private Long extractUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }
}
