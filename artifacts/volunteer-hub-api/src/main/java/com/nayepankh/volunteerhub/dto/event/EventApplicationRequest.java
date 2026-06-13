package com.nayepankh.volunteerhub.dto.event;

import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EventApplicationRequest {
    @NotNull private Long eventId;
    private ApplicationStatus status;
}
