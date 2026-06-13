package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.report.ReportRow;
import com.nayepankh.volunteerhub.service.ReportService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Generate and export reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/volunteers")
    @Operation(summary = "Volunteer participation report")
    public ResponseEntity<?> volunteers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "json") String format) {
        ReportRow report = reportService.getVolunteerReport(page, size);
        return respond(report, format, "volunteers-report");
    }

    @GetMapping("/attendance")
    @Operation(summary = "Attendance report")
    public ResponseEntity<?> attendance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "json") String format) {
        ReportRow report = reportService.getAttendanceReport(page, size);
        return respond(report, format, "attendance-report");
    }

    @GetMapping("/events")
    @Operation(summary = "Event report")
    public ResponseEntity<?> events(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "json") String format) {
        ReportRow report = reportService.getEventReport(page, size);
        return respond(report, format, "events-report");
    }

    @GetMapping("/skills")
    @Operation(summary = "Skill distribution report")
    public ResponseEntity<?> skills(@RequestParam(defaultValue = "json") String format) {
        ReportRow report = reportService.getSkillDistributionReport();
        return respond(report, format, "skills-report");
    }

    private ResponseEntity<?> respond(ReportRow report, String format, String filename) {
        if ("csv".equalsIgnoreCase(format)) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", filename + ".csv");
            return ResponseEntity.ok().headers(headers).body(reportService.toCsv(report));
        }
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
