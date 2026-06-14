package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.certificate.CertificateResponse;
import com.nayepankh.volunteerhub.entity.Certificate;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.exception.UnauthorizedException;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.CertificateService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificates", description = "Generate and download volunteer certificates")
@SecurityRequirement(name = "bearerAuth")
public class CertificateController {

    private final CertificateService certificateService;
    private final JwtUtil jwtUtil;

    @GetMapping
    @Operation(summary = "List certificates (own for volunteer, all for admin/coordinator)")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> list(HttpServletRequest req) {
        Long callerId = extractUserId(req);
        if (callerId == null) {
            throw new UnauthorizedException("Authentication required");
        }
        String callerRole = extractRole(req);
        boolean isStaff = Role.ROLE_ADMIN.name().equals(callerRole)
                || Role.ROLE_COORDINATOR.name().equals(callerRole);
        if (isStaff) {
            return ResponseEntity.ok(ApiResponse.success(
                    certificateService.getAllCertificates()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                certificateService.getVolunteerCertificates(callerId)));
    }

    @PostMapping("/generate/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate certificates for event (approved + attended volunteers only)")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> generate(
            @PathVariable Long eventId,
            HttpServletRequest req) {
        Long adminId = extractUserId(req);
        return ResponseEntity.ok(ApiResponse.success("Certificates generated",
                certificateService.generateForEvent(eventId, adminId)));
    }

    @GetMapping("/volunteer/{volunteerId}")
    @Operation(summary = "Get certificates for a volunteer (self or admin/coordinator)")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> byVolunteer(
            @PathVariable Long volunteerId,
            HttpServletRequest req) {
        requireSelfOrStaff(volunteerId, req);
        return ResponseEntity.ok(ApiResponse.success(
                certificateService.getVolunteerCertificates(volunteerId)));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a certificate PDF (owner or admin/coordinator)")
    public ResponseEntity<byte[]> download(
            @PathVariable Long id,
            HttpServletRequest req) {
        Long callerId = extractUserId(req);
        String callerRole = extractRole(req);
        boolean isStaff = Role.ROLE_ADMIN.name().equals(callerRole)
                || Role.ROLE_COORDINATOR.name().equals(callerRole);

        Certificate cert = certificateService.getCertificateById(id);
        if (!isStaff && !cert.getVolunteer().getId().equals(callerId)) {
            throw new UnauthorizedException("You can only download your own certificates");
        }

        byte[] pdf = certificateService.downloadCertificate(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "certificate-" + cert.getCertificateNumber() + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Long extractUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }

    private String extractRole(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractRole(auth.substring(7));
        }
        return null;
    }

    private void requireSelfOrStaff(Long targetId, HttpServletRequest req) {
        Long callerId = extractUserId(req);
        String role = extractRole(req);
        boolean isStaff = Role.ROLE_ADMIN.name().equals(role)
                || Role.ROLE_COORDINATOR.name().equals(role);
        if (callerId == null || (!callerId.equals(targetId) && !isStaff)) {
            throw new UnauthorizedException("Access denied");
        }
    }
}
