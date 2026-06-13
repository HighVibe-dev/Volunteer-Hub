package com.nayepankh.volunteerhub.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.nayepankh.volunteerhub.dto.certificate.CertificateResponse;
import com.nayepankh.volunteerhub.entity.*;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.exception.UnauthorizedException;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EventRepository eventRepository;
    private final EventApplicationRepository applicationRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    /**
     * Generate certificates for volunteers who are:
     *   1. APPROVED in EventApplication, AND
     *   2. Marked present=true in Attendance
     * Volunteers who were approved but did not actually attend do NOT receive a certificate.
     */
    @Transactional
    public List<CertificateResponse> generateForEvent(Long eventId, Long adminId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));

        List<EventApplication> approved = applicationRepository
                .findByEventIdAndStatus(eventId, ApplicationStatus.APPROVED);

        List<CertificateResponse> results = new ArrayList<>();
        for (EventApplication app : approved) {
            User volunteer = app.getVolunteer();

            // Require confirmed attendance (present=true)
            Optional<Attendance> attendanceOpt = attendanceRepository
                    .findByVolunteerIdAndEventId(volunteer.getId(), eventId);
            if (attendanceOpt.isEmpty() || !attendanceOpt.get().isPresent()) {
                continue; // skip — did not actually attend
            }

            if (certificateRepository.existsByVolunteerIdAndEventId(volunteer.getId(), eventId)) {
                continue; // already generated
            }

            double hours = attendanceOpt.get().getTotalHours();

            byte[] pdf = generatePdf(volunteer.getName(), event.getTitle(), hours,
                    event.getStartDate() != null
                            ? event.getStartDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"))
                            : "N/A");

            Certificate cert = Certificate.builder()
                    .volunteer(volunteer)
                    .event(event)
                    .certificateNumber("NP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .pdfData(pdf)
                    .build();
            cert = certificateRepository.save(cert);

            notificationService.createNotification(volunteer.getId(), "Certificate Generated",
                    "Your certificate for \"" + event.getTitle() + "\" is ready to download!");
            auditLogService.log(adminId, "CERTIFICATE_GENERATED",
                    "Cert " + cert.getCertificateNumber() + " for " + volunteer.getName());
            results.add(toResponse(cert));
        }
        return results;
    }

    /**
     * List certificates for a given volunteer — caller must be that volunteer or an admin/coordinator.
     */
    public List<CertificateResponse> getVolunteerCertificates(Long volunteerId) {
        return certificateRepository.findByVolunteerId(volunteerId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Download a certificate PDF — caller must own the certificate or be admin/coordinator.
     * Ownership enforcement is done in the controller.
     */
    public byte[] downloadCertificate(Long certId) {
        Certificate cert = certificateRepository.findById(certId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", certId));
        if (cert.getPdfData() != null && cert.getPdfData().length > 0) return cert.getPdfData();
        return generatePdf(cert.getVolunteer().getName(), cert.getEvent().getTitle(), 0, "N/A");
    }

    public Certificate getCertificateById(Long id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", id));
    }

    private byte[] generatePdf(String volunteerName, String eventTitle, double hours, String date) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4.rotate());
            document.setMargins(40, 60, 40, 60);

            document.add(new Paragraph("NAYE PANKH FOUNDATION")
                    .setFontSize(28).setBold()
                    .setFontColor(ColorConstants.DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("UP Government, 80G & 12A Registered NGO")
                    .setFontSize(11).setItalic()
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\nCERTIFICATE OF APPRECIATION\n")
                    .setFontSize(22).setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("This is to certify that")
                    .setFontSize(13).setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph(volunteerName)
                    .setFontSize(24).setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(new DeviceRgb(0, 102, 204)));

            document.add(new Paragraph("has successfully volunteered in the event")
                    .setFontSize(13).setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\"" + eventTitle + "\"")
                    .setFontSize(18).setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph(String.format("Total Hours Contributed: %.1f hours", hours))
                    .setFontSize(13).setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("Date: " + date)
                    .setFontSize(12).setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n\n_______________________________\n      Authorized Signatory\n   NayePankh Foundation")
                    .setFontSize(11).setTextAlignment(TextAlignment.RIGHT));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    private CertificateResponse toResponse(Certificate c) {
        return CertificateResponse.builder()
                .id(c.getId())
                .volunteerId(c.getVolunteer().getId())
                .volunteerName(c.getVolunteer().getName())
                .eventId(c.getEvent().getId())
                .eventTitle(c.getEvent().getTitle())
                .certificateNumber(c.getCertificateNumber())
                .generatedDate(c.getGeneratedDate())
                .build();
    }
}
