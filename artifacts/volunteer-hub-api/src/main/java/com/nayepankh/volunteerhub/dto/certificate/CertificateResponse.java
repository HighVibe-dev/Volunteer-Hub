package com.nayepankh.volunteerhub.dto.certificate;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CertificateResponse {
    private Long id;
    private Long volunteerId;
    private String volunteerName;
    private Long eventId;
    private String eventTitle;
    private String certificateNumber;
    private LocalDateTime generatedDate;
}
