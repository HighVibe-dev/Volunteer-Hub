package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.dashboard.DashboardStatsResponse;
import com.nayepankh.volunteerhub.dto.dashboard.LeaderboardEntry;
import com.nayepankh.volunteerhub.entity.User;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import com.nayepankh.volunteerhub.enums.EventStatus;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final AttendanceRepository attendanceRepository;
    private final VolunteerSkillRepository volunteerSkillRepository;
    private final EventApplicationRepository applicationRepository;

    public DashboardStatsResponse getStats() {
        long totalVolunteers = userRepository.countByRole(Role.ROLE_VOLUNTEER);
        long activeVolunteers = userRepository.countActiveByRole(Role.ROLE_VOLUNTEER);
        long totalEvents = eventRepository.count();
        long completedEvents = eventRepository.countByStatus(EventStatus.COMPLETED);
        Double totalHoursRaw = attendanceRepository.sumAllHours();
        double totalHours = totalHoursRaw != null ? totalHoursRaw : 0.0;

        LocalDateTime since = LocalDateTime.now().minusMonths(12);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        List<DashboardStatsResponse.MonthlyDataPoint> growthData =
                userRepository.countMonthlyVolunteerGrowth(since).stream()
                        .map(row -> DashboardStatsResponse.MonthlyDataPoint.builder()
                                .month(((LocalDateTime) row[0]).format(fmt))
                                .value(((Number) row[1]).doubleValue())
                                .build())
                        .collect(Collectors.toList());

        List<DashboardStatsResponse.MonthlyDataPoint> hoursData =
                attendanceRepository.sumMonthlyHours(since).stream()
                        .map(row -> DashboardStatsResponse.MonthlyDataPoint.builder()
                                .month(((LocalDateTime) row[0]).format(fmt))
                                .value(row[1] != null ? ((Number) row[1]).doubleValue() : 0.0)
                                .build())
                        .collect(Collectors.toList());

        List<DashboardStatsResponse.MonthlyDataPoint> eventData =
                eventRepository.countMonthlyEvents(since).stream()
                        .map(row -> DashboardStatsResponse.MonthlyDataPoint.builder()
                                .month(((LocalDateTime) row[0]).format(fmt))
                                .value(((Number) row[1]).doubleValue())
                                .build())
                        .collect(Collectors.toList());

        List<DashboardStatsResponse.SkillDataPoint> skillData =
                volunteerSkillRepository.getSkillDistribution().stream()
                        .limit(10)
                        .map(row -> DashboardStatsResponse.SkillDataPoint.builder()
                                .skill((String) row[0])
                                .count(((Number) row[1]).longValue())
                                .build())
                        .collect(Collectors.toList());

        List<User> topUsers = userRepository.findByRole(Role.ROLE_VOLUNTEER).stream()
                .sorted(Comparator.comparingDouble(User::getTotalHours).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<DashboardStatsResponse.TopVolunteer> topVolunteers = topUsers.stream()
                .map(u -> DashboardStatsResponse.TopVolunteer.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .hours(u.getTotalHours())
                        .badgeLevel(u.getBadgeLevel().name())
                        .build())
                .collect(Collectors.toList());

        // Attendance percentage: present / total attendance records
        long totalAttendanceRecords = attendanceRepository.count();
        long totalPresentRecords = attendanceRepository.countAllPresent();
        double attendancePct = totalAttendanceRecords > 0
                ? (double) totalPresentRecords / totalAttendanceRecords * 100.0 : 0.0;

        return DashboardStatsResponse.builder()
                .totalVolunteers(totalVolunteers)
                .activeVolunteers(activeVolunteers)
                .totalEvents(totalEvents)
                .completedEvents(completedEvents)
                .totalVolunteerHours(totalHours)
                .attendancePercentage(attendancePct)
                .monthlyVolunteerGrowth(growthData)
                .monthlyHoursTrend(hoursData)
                .monthlyEventCount(eventData)
                .skillDistribution(skillData)
                .topVolunteers(topVolunteers)
                .build();
    }

    /**
     * Leaderboard composite score:
     *   score = (hours / maxHours × 40%) + (participation / maxPart × 40%) + (attendanceRate × 20%)
     * Returns top `limit` volunteers ranked by composite score.
     */
    public List<LeaderboardEntry> getLeaderboard(int limit) {
        List<User> volunteers = userRepository.findByRole(Role.ROLE_VOLUNTEER);

        if (volunteers.isEmpty()) return List.of();

        // Compute raw metrics
        Map<Long, Long> participationMap = new HashMap<>();
        Map<Long, Double> attendanceRateMap = new HashMap<>();

        for (User u : volunteers) {
            long participated = applicationRepository.countByVolunteerIdAndStatus(
                    u.getId(), ApplicationStatus.APPROVED);
            participationMap.put(u.getId(), participated);

            long total = attendanceRepository.countTotalAttendanceByVolunteerId(u.getId());
            long present = attendanceRepository.countEventsAttendedByVolunteerId(u.getId());
            attendanceRateMap.put(u.getId(), total > 0 ? (double) present / total : 0.0);
        }

        double maxHours = volunteers.stream()
                .mapToDouble(User::getTotalHours).max().orElse(1.0);
        if (maxHours == 0) maxHours = 1.0;

        long maxPart = participationMap.values().stream().mapToLong(v -> v).max().orElse(1L);
        if (maxPart == 0) maxPart = 1L;

        final double fMaxHours = maxHours;
        final long fMaxPart = maxPart;

        List<LeaderboardEntry> entries = new ArrayList<>();
        for (User u : volunteers) {
            double normHours = u.getTotalHours() / fMaxHours;
            double normPart = (double) participationMap.getOrDefault(u.getId(), 0L) / fMaxPart;
            double rate = attendanceRateMap.getOrDefault(u.getId(), 0.0);
            double score = (normHours * 0.40) + (normPart * 0.40) + (rate * 0.20);

            entries.add(LeaderboardEntry.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .badgeLevel(u.getBadgeLevel())
                    .totalHours(u.getTotalHours())
                    .eventsParticipated(participationMap.getOrDefault(u.getId(), 0L))
                    .attendanceRate(attendanceRateMap.getOrDefault(u.getId(), 0.0))
                    .score(score)
                    .build());
        }

        // Sort by score descending, then assign rank
        entries.sort(Comparator.comparingDouble(LeaderboardEntry::getScore).reversed());

        List<LeaderboardEntry> ranked = new ArrayList<>();
        int rank = 1;
        for (LeaderboardEntry e : entries.stream().limit(limit).collect(Collectors.toList())) {
            e.setRank(rank++);
            ranked.add(e);
        }
        return ranked;
    }
}
