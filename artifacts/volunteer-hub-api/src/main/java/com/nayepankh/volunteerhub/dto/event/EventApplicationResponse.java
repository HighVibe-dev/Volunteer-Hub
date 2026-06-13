package com.nayepankh.volunteerhub.dto.event;

import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EventApplicationResponse {
    private Long id;
    private Long volunteerId;
    private String volunteerName;
    private String volunteerEmail;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime applicationDate;
    private ApplicationStatus status;
}
