package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.event.EventApplicationResponse;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.exception.UnauthorizedException;
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

    /**
     * Volunteer applies to an event — always uses the JWT user ID.
     * A volunteer cannot apply on behalf of another volunteer.
     */
    @PostMapping
    @Operation(summary = "Apply to an event (authenticated volunteer's own application)")
    public ResponseEntity<ApiResponse<EventApplicationResponse>> apply(
            @RequestParam Long eventId,
            HttpServletRequest req) {
        Long userId = requireAuthenticatedUserId(req);
        return ResponseEntity.ok(ApiResponse.success("Application submitted",
                applicationService.apply(userId, eventId)));
    }

    /**
     * Coordinator or Admin approves/rejects an application.
     * Status transitions enforced: PENDING→APPROVED|REJECTED, APPROVED→REJECTED only.
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Approve or reject an application (state-machine enforced)")
    public ResponseEntity<ApiResponse<EventApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            HttpServletRequest req) {
        Long coordinatorId = requireAuthenticatedUserId(req);
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                applicationService.updateStatus(id, status, coordinatorId)));
    }

    /**
     * Filterable endpoint: supports filtering by eventId, volunteerId (staff only for other volunteers), status.
     * Volunteers may only query their own applications (volunteerId must be omitted or match self).
     */
    @GetMapping
    @Operation(summary = "List applications — filter by eventId, volunteerId, status")
    public ResponseEntity<ApiResponse<Page<EventApplicationResponse>>> list(
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) Long volunteerId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest req) {

        Long callerId = requireAuthenticatedUserId(req);
        String callerRole = extractRole(req);
        boolean isStaff = Role.ROLE_ADMIN.name().equals(callerRole)
                || Role.ROLE_COORDINATOR.name().equals(callerRole);

        // Non-staff can only see their own applications
        if (!isStaff) {
            if (volunteerId != null && !volunteerId.equals(callerId)) {
                throw new UnauthorizedException("You can only view your own applications");
            }
            volunteerId = callerId;
        }

        return ResponseEntity.ok(ApiResponse.success(
                applicationService.getApplicationsFiltered(eventId, volunteerId, status,
                        PageRequest.of(page, size))));
    }

    /**
     * Convenience: all applications for a specific event (admin/coordinator only).
     */
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "All applications for an event")
    public ResponseEntity<ApiResponse<Page<EventApplicationResponse>>> byEvent(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.getApplicationsByEvent(eventId, PageRequest.of(page, size))));
    }

    /**
     * Own applications only — volunteers always get their own list.
     */
    @GetMapping("/my")
    @Operation(summary = "Get my event applications")
    public ResponseEntity<ApiResponse<Page<EventApplicationResponse>>> myApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest req) {
        Long userId = requireAuthenticatedUserId(req);
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.getApplicationsByVolunteer(userId, PageRequest.of(page, size))));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Long requireAuthenticatedUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            Long uid = jwtUtil.extractUserId(auth.substring(7));
            if (uid != null) return uid;
        }
        throw new UnauthorizedException("Authentication required");
    }

    private String extractRole(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractRole(auth.substring(7));
        }
        return null;
    }
}
