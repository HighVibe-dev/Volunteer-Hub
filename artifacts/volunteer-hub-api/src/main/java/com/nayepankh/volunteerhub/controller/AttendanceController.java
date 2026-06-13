package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.attendance.*;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.AttendanceService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Track volunteer attendance and hours")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final JwtUtil jwtUtil;

    @PostMapping("/check-in")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Mark volunteer check-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody AttendanceRequest req,
            HttpServletRequest httpReq) {
        return ResponseEntity.ok(ApiResponse.success("Checked in",
                attendanceService.checkIn(req, extractUserId(httpReq))));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Mark volunteer check-out and calculate hours")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @RequestParam Long volunteerId,
            @RequestParam Long eventId,
            @RequestParam(required = false) LocalDateTime checkOutTime,
            HttpServletRequest httpReq) {
        return ResponseEntity.ok(ApiResponse.success("Checked out",
                attendanceService.checkOut(volunteerId, eventId, checkOutTime, extractUserId(httpReq))));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Get attendance for an event")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> byEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getEventAttendance(eventId)));
    }

    @GetMapping("/volunteer/{volunteerId}")
    @Operation(summary = "Get attendance history for a volunteer")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> byVolunteer(@PathVariable Long volunteerId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getVolunteerAttendance(volunteerId)));
    }

    private Long extractUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }
}
