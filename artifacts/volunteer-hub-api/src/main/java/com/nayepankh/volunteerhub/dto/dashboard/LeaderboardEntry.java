package com.nayepankh.volunteerhub.dto.dashboard;

import com.nayepankh.volunteerhub.enums.BadgeLevel;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardEntry {
    private int rank;
    private Long userId;
    private String name;
    private BadgeLevel badgeLevel;
    private double totalHours;
    private long eventsParticipated;
    private double attendanceRate;
    private double score;
}
