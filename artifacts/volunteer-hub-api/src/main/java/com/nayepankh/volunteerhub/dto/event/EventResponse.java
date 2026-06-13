package com.nayepankh.volunteerhub.dto.event;

import com.nayepankh.volunteerhub.enums.EventStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int requiredVolunteers;
    private EventStatus status;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private List<EventRequirementResponse> requirements;
    private long applicantCount;
    private long approvedCount;
}
