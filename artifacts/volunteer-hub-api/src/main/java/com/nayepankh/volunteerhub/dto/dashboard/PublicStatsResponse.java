package com.nayepankh.volunteerhub.dto.dashboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicStatsResponse {
    private long totalVolunteers;
    private long totalEvents;
    private long eventsThisMonth;
    private double totalVolunteerHours;
    private long certificatesIssued;
}
