package com.nayepankh.volunteerhub.dto.event;

import com.nayepankh.volunteerhub.enums.EventStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int requiredVolunteers;
    private EventStatus status = EventStatus.UPCOMING;
    private List<EventRequirementRequest> requirements;
}
