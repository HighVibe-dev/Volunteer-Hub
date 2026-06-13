package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.certificate.CertificateResponse;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.CertificateService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/generate/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate certificates for all approved volunteers in an event")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> generate(
            @PathVariable Long eventId,
            HttpServletRequest req) {
        Long adminId = extractUserId(req);
        return ResponseEntity.ok(ApiResponse.success("Certificates generated",
                certificateService.generateForEvent(eventId, adminId)));
    }

    @GetMapping("/volunteer/{volunteerId}")
    @Operation(summary = "Get all certificates for a volunteer")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> byVolunteer(@PathVariable Long volunteerId) {
        return ResponseEntity.ok(ApiResponse.success(certificateService.getVolunteerCertificates(volunteerId)));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a certificate PDF")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        byte[] pdf = certificateService.downloadCertificate(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate-" + id + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    private Long extractUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }
}
