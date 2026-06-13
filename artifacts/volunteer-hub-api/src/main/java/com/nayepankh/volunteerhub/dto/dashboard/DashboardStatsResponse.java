package com.nayepankh.volunteerhub.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalVolunteers;
    private long activeVolunteers;
    private long totalEvents;
    private long completedEvents;
    private double totalVolunteerHours;
    private double attendancePercentage;
    private List<MonthlyDataPoint> monthlyVolunteerGrowth;
    private List<MonthlyDataPoint> monthlyHoursTrend;
    private List<MonthlyDataPoint> monthlyEventCount;
    private List<SkillDataPoint> skillDistribution;
    private List<TopVolunteer> topVolunteers;

    @Data @Builder
    public static class MonthlyDataPoint {
        private String month;
        private double value;
    }

    @Data @Builder
    public static class SkillDataPoint {
        private String skill;
        private long count;
    }

    @Data @Builder
    public static class TopVolunteer {
        private Long id;
        private String name;
        private double hours;
        private String badgeLevel;
    }
}
