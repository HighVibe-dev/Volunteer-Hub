package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEventId(Long eventId);
    List<Attendance> findByVolunteerId(Long volunteerId);
    Optional<Attendance> findByVolunteerIdAndEventId(Long volunteerId, Long eventId);

    @Query("SELECT COALESCE(SUM(a.totalHours), 0) FROM Attendance a WHERE a.volunteer.id = :volunteerId")
    double sumHoursByVolunteerId(@Param("volunteerId") Long volunteerId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.event.id = :eventId AND a.present = true")
    long countPresentByEventId(@Param("eventId") Long eventId);

    @Query("SELECT SUM(a.totalHours) FROM Attendance a WHERE a.checkInTime >= :since")
    Double sumTotalHoursSince(@Param("since") LocalDateTime since);

    @Query("SELECT SUM(a.totalHours) FROM Attendance a")
    Double sumAllHours();

    @Query("SELECT a.checkInTime, SUM(a.totalHours) FROM Attendance a WHERE a.checkInTime >= :since GROUP BY FUNCTION('MONTH', a.checkInTime), FUNCTION('YEAR', a.checkInTime) ORDER BY a.checkInTime")
    List<Object[]> sumMonthlyHours(@Param("since") LocalDateTime since);
}
