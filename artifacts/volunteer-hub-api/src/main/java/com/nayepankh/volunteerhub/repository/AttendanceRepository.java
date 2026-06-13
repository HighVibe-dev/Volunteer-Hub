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

    /**
     * Monthly hours sum using native PostgreSQL DATE_TRUNC.
     * Returns rows of [truncated_month (Timestamp), sum_hours (Double)].
     */
    @Query(value = "SELECT DATE_TRUNC('month', check_in_time) AS month, COALESCE(SUM(total_hours), 0) AS hours " +
                   "FROM attendances WHERE check_in_time >= :since " +
                   "GROUP BY DATE_TRUNC('month', check_in_time) " +
                   "ORDER BY month",
           nativeQuery = true)
    List<Object[]> sumMonthlyHours(@Param("since") LocalDateTime since);

    /** Count how many distinct events a volunteer attended (present=true). */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.volunteer.id = :volunteerId AND a.present = true")
    long countEventsAttendedByVolunteerId(@Param("volunteerId") Long volunteerId);

    /** Count total events a volunteer was checked into (present or absent). */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.volunteer.id = :volunteerId")
    long countTotalAttendanceByVolunteerId(@Param("volunteerId") Long volunteerId);

    /** Count all present=true records across all volunteers (for dashboard %). */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.present = true")
    long countAllPresent();
}
