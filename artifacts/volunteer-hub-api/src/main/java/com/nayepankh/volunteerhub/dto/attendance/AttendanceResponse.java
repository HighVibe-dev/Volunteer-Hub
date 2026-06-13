package com.nayepankh.volunteerhub.dto.attendance;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceResponse {
    private Long id;
    private Long volunteerId;
    private String volunteerName;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private double totalHours;
    private boolean present;
}
