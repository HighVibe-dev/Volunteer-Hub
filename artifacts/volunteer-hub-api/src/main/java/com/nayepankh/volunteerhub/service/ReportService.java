package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.report.ReportRow;
import com.nayepankh.volunteerhub.entity.*;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final AttendanceRepository attendanceRepository;
    private final VolunteerSkillRepository volunteerSkillRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public ReportRow getVolunteerReport(int page, int size) {
        var volunteers = userRepository.findByRole(Role.ROLE_VOLUNTEER,
                PageRequest.of(page, size));
        List<String> headers = List.of("ID","Name","Email","Phone","City","TotalHours","BadgeLevel","Active","JoinDate");
        List<Map<String,String>> rows = volunteers.stream().map(u -> {
            Map<String,String> row = new LinkedHashMap<>();
            row.put("ID", String.valueOf(u.getId()));
            row.put("Name", u.getName());
            row.put("Email", u.getEmail());
            row.put("Phone", u.getPhone() != null ? u.getPhone() : "");
            row.put("City", "");
            row.put("TotalHours", String.format("%.1f", u.getTotalHours()));
            row.put("BadgeLevel", u.getBadgeLevel().name());
            row.put("Active", String.valueOf(u.isActive()));
            row.put("JoinDate", u.getCreatedAt() != null ? u.getCreatedAt().format(FMT) : "");
            return row;
        }).collect(Collectors.toList());
        return ReportRow.builder().headers(headers).rows(rows).totalCount(volunteers.getTotalElements()).build();
    }

    public ReportRow getAttendanceReport(int page, int size) {
        var attendances = attendanceRepository.findAll(PageRequest.of(page, size));
        List<String> headers = List.of("ID","VolunteerName","EventTitle","CheckIn","CheckOut","Hours","Present");
        List<Map<String,String>> rows = attendances.stream().map(a -> {
            Map<String,String> row = new LinkedHashMap<>();
            row.put("ID", String.valueOf(a.getId()));
            row.put("VolunteerName", a.getVolunteer().getName());
            row.put("EventTitle", a.getEvent().getTitle());
            row.put("CheckIn", a.getCheckInTime() != null ? a.getCheckInTime().format(FMT) : "");
            row.put("CheckOut", a.getCheckOutTime() != null ? a.getCheckOutTime().format(FMT) : "");
            row.put("Hours", String.format("%.1f", a.getTotalHours()));
            row.put("Present", String.valueOf(a.isPresent()));
            return row;
        }).collect(Collectors.toList());
        return ReportRow.builder().headers(headers).rows(rows).totalCount(attendances.getTotalElements()).build();
    }

    public ReportRow getEventReport(int page, int size) {
        var events = eventRepository.findAll(PageRequest.of(page, size));
        List<String> headers = List.of("ID","Title","Location","StartDate","EndDate","Status","Required","CreatedBy");
        List<Map<String,String>> rows = events.stream().map(e -> {
            Map<String,String> row = new LinkedHashMap<>();
            row.put("ID", String.valueOf(e.getId()));
            row.put("Title", e.getTitle());
            row.put("Location", e.getLocation() != null ? e.getLocation() : "");
            row.put("StartDate", e.getStartDate() != null ? e.getStartDate().format(FMT) : "");
            row.put("EndDate", e.getEndDate() != null ? e.getEndDate().format(FMT) : "");
            row.put("Status", e.getStatus().name());
            row.put("Required", String.valueOf(e.getRequiredVolunteers()));
            row.put("CreatedBy", e.getCreatedBy() != null ? e.getCreatedBy().getName() : "");
            return row;
        }).collect(Collectors.toList());
        return ReportRow.builder().headers(headers).rows(rows).totalCount(events.getTotalElements()).build();
    }

    public ReportRow getSkillDistributionReport() {
        List<Object[]> data = volunteerSkillRepository.getSkillDistribution();
        List<String> headers = List.of("Skill","Count");
        List<Map<String,String>> rows = data.stream().map(row -> {
            Map<String,String> r = new LinkedHashMap<>();
            r.put("Skill", (String) row[0]);
            r.put("Count", String.valueOf(((Number) row[1]).longValue()));
            return r;
        }).collect(Collectors.toList());
        return ReportRow.builder().headers(headers).rows(rows).totalCount(rows.size()).build();
    }

    public String toCsv(ReportRow report) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", report.getHeaders())).append("\n");
        for (Map<String,String> row : report.getRows()) {
            sb.append(report.getHeaders().stream()
                    .map(h -> "\"" + row.getOrDefault(h, "").replace("\"", "\"\"") + "\"")
                    .collect(Collectors.joining(","))).append("\n");
        }
        return sb.toString();
    }
}
