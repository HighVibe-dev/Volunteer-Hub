package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.attendance.*;
import com.nayepankh.volunteerhub.entity.*;
import com.nayepankh.volunteerhub.enums.BadgeLevel;
import com.nayepankh.volunteerhub.exception.BadRequestException;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public AttendanceResponse checkIn(AttendanceRequest req, Long coordinatorId) {
        User volunteer = userRepository.findById(req.getVolunteerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.getVolunteerId()));
        Event event = eventRepository.findById(req.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", req.getEventId()));

        if (attendanceRepository.findByVolunteerIdAndEventId(req.getVolunteerId(), req.getEventId()).isPresent()) {
            throw new BadRequestException("Attendance already recorded for this volunteer and event");
        }

        Attendance attendance = Attendance.builder()
                .volunteer(volunteer)
                .event(event)
                .checkInTime(req.getCheckInTime() != null ? req.getCheckInTime() : LocalDateTime.now())
                .present(req.isPresent())
                .build();
        attendance = attendanceRepository.save(attendance);
        auditLogService.log(coordinatorId, "ATTENDANCE_CHECKIN",
                "Volunteer " + volunteer.getName() + " checked in to " + event.getTitle());
        return toResponse(attendance);
    }

    @Transactional
    public AttendanceResponse checkOut(Long volunteerId, Long eventId, LocalDateTime checkOutTime, Long coordinatorId) {
        Attendance attendance = attendanceRepository.findByVolunteerIdAndEventId(volunteerId, eventId)
                .orElseThrow(() -> new BadRequestException("No check-in found for this volunteer and event"));

        LocalDateTime checkOut = checkOutTime != null ? checkOutTime : LocalDateTime.now();
        attendance.setCheckOutTime(checkOut);

        if (attendance.getCheckInTime() != null) {
            double hours = Duration.between(attendance.getCheckInTime(), checkOut).toMinutes() / 60.0;
            attendance.setTotalHours(Math.max(0, hours));
        }
        attendance = attendanceRepository.save(attendance);

        User volunteer = attendance.getVolunteer();
        double totalHours = attendanceRepository.sumHoursByVolunteerId(volunteerId);
        volunteer.setTotalHours(totalHours);
        volunteer.setBadgeLevel(calculateBadge(totalHours));
        userRepository.save(volunteer);

        auditLogService.log(coordinatorId, "ATTENDANCE_CHECKOUT",
                "Volunteer " + volunteer.getName() + " checked out from " + attendance.getEvent().getTitle());
        return toResponse(attendance);
    }

    public List<AttendanceResponse> getEventAttendance(Long eventId) {
        return attendanceRepository.findByEventId(eventId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<AttendanceResponse> getVolunteerAttendance(Long volunteerId) {
        return attendanceRepository.findByVolunteerId(volunteerId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private BadgeLevel calculateBadge(double totalHours) {
        if (totalHours >= 200) return BadgeLevel.PLATINUM;
        if (totalHours >= 100) return BadgeLevel.GOLD;
        if (totalHours >= 50) return BadgeLevel.SILVER;
        if (totalHours >= 10) return BadgeLevel.BRONZE;
        return BadgeLevel.NONE;
    }

    private AttendanceResponse toResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .volunteerId(a.getVolunteer().getId())
                .volunteerName(a.getVolunteer().getName())
                .eventId(a.getEvent().getId())
                .eventTitle(a.getEvent().getTitle())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .totalHours(a.getTotalHours())
                .present(a.isPresent())
                .build();
    }
}
