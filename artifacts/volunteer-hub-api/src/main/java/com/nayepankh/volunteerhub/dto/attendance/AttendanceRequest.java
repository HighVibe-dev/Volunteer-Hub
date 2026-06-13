package com.nayepankh.volunteerhub.dto.attendance;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AttendanceRequest {
    @NotNull private Long volunteerId;
    @NotNull private Long eventId;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private boolean present = true;
}
