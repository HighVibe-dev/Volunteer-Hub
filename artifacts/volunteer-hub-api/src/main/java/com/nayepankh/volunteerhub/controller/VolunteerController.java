package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.volunteer.*;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.exception.UnauthorizedException;
import com.nayepankh.volunteerhub.repository.AttendanceRepository;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.VolunteerService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/volunteers")
@RequiredArgsConstructor
@Tag(name = "Volunteers", description = "Volunteer profile and skill management")
@SecurityRequirement(name = "bearerAuth")
public class VolunteerController {

    private final VolunteerService volunteerService;
    private final JwtUtil jwtUtil;
    private final AttendanceRepository attendanceRepository;

    /**
     * GET /volunteers — admin/coordinator only.
     * Supports: ?search=&city=&availability=&skillId=&page=&size=
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "List volunteers — filter by city, availability, skillId, or free-text search")
    public ResponseEntity<ApiResponse<Page<VolunteerResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String availability,
            @RequestParam(required = false) Long skillId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                volunteerService.getAllVolunteers(search, city, availability, skillId,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/me")
    @Operation(summary = "Get own volunteer profile (current authenticated volunteer)")
    public ResponseEntity<ApiResponse<VolunteerResponse>> getMe(HttpServletRequest req) {
        Long callerId = callerUserId(req);
        if (callerId == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getVolunteerById(callerId)));
    }

    @GetMapping("/me/monthly-stats")
    @Operation(summary = "Get volunteer's event count for the current month")
    public ResponseEntity<ApiResponse<MonthlyStatsResponse>> getMyMonthlyStats(HttpServletRequest req) {
        Long callerId = callerUserId(req);
        if (callerId == null) {
            throw new UnauthorizedException("Authentication required");
        }
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long count = attendanceRepository.countAttendedByVolunteerSince(callerId, startOfMonth);
        return ResponseEntity.ok(ApiResponse.success(MonthlyStatsResponse.builder()
                .eventsThisMonth(count)
                .build()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get volunteer by ID (self or admin/coordinator)")
    public ResponseEntity<ApiResponse<VolunteerResponse>> getById(
            @PathVariable Long id,
            HttpServletRequest req) {
        requireSelfOrStaff(id, req);
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getVolunteerById(id)));
    }

    @PutMapping("/{id}/profile")
    @Operation(summary = "Update own volunteer profile (self only)")
    public ResponseEntity<ApiResponse<VolunteerResponse>> updateProfile(
            @PathVariable Long id,
            @RequestBody VolunteerProfileRequest profileReq,
            HttpServletRequest req) {
        requireSelf(id, req);
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                volunteerService.updateProfile(id, profileReq)));
    }

    @GetMapping("/{id}/skills")
    @Operation(summary = "Get volunteer skills (self or admin/coordinator)")
    public ResponseEntity<ApiResponse<List<SkillResponse>>> getSkills(
            @PathVariable Long id,
            HttpServletRequest req) {
        requireSelfOrStaff(id, req);
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getSkills(id)));
    }

    @PostMapping("/{id}/skills")
    @Operation(summary = "Add skill to own profile (self only)")
    public ResponseEntity<ApiResponse<SkillResponse>> addSkill(
            @PathVariable Long id,
            @RequestBody SkillRequest skillReq,
            HttpServletRequest req) {
        requireSelf(id, req);
        return ResponseEntity.ok(ApiResponse.success("Skill added", volunteerService.addSkill(id, skillReq)));
    }

    @DeleteMapping("/{id}/skills/{skillId}")
    @Operation(summary = "Remove skill from own profile (self only)")
    public ResponseEntity<ApiResponse<Void>> removeSkill(
            @PathVariable Long id,
            @PathVariable Long skillId,
            HttpServletRequest req) {
        requireSelf(id, req);
        volunteerService.removeSkill(id, skillId);
        return ResponseEntity.ok(ApiResponse.success("Skill removed", null));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle volunteer active status (admin only)")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        volunteerService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Status toggled", null));
    }

    // ── Ownership helpers ──────────────────────────────────────────────────────

    private Long callerUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }

    private String callerRole(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractRole(auth.substring(7));
        }
        return null;
    }

    private void requireSelf(Long targetId, HttpServletRequest req) {
        Long callerId = callerUserId(req);
        if (callerId == null || !callerId.equals(targetId)) {
            throw new UnauthorizedException("You can only modify your own profile");
        }
    }

    private void requireSelfOrStaff(Long targetId, HttpServletRequest req) {
        Long callerId = callerUserId(req);
        String role = callerRole(req);
        boolean isStaff = Role.ROLE_ADMIN.name().equals(role) || Role.ROLE_COORDINATOR.name().equals(role);
        if (callerId == null || (!callerId.equals(targetId) && !isStaff)) {
            throw new UnauthorizedException("Access denied");
        }
    }
}
