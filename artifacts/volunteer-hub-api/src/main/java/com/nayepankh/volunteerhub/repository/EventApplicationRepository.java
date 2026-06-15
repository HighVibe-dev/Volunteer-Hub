package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.EventApplication;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {
    Page<EventApplication> findByEventId(Long eventId, Pageable pageable);
    Page<EventApplication> findByVolunteerId(Long volunteerId, Pageable pageable);
    List<EventApplication> findByEventIdAndStatus(Long eventId, ApplicationStatus status);
    Optional<EventApplication> findByVolunteerIdAndEventId(Long volunteerId, Long eventId);
    boolean existsByVolunteerIdAndEventId(Long volunteerId, Long eventId);
    long countByEventId(Long eventId);
    long countByEventIdAndStatus(Long eventId, ApplicationStatus status);
    long countByVolunteerIdAndStatus(Long volunteerId, ApplicationStatus status);
    long countByStatus(ApplicationStatus status);

    @Query("SELECT ea FROM EventApplication ea WHERE " +
           "(:eventId IS NULL OR ea.event.id = :eventId) AND " +
           "(:volunteerId IS NULL OR ea.volunteer.id = :volunteerId) AND " +
           "(:status IS NULL OR ea.status = :status)")
    Page<EventApplication> findFiltered(
            @Param("eventId") Long eventId,
            @Param("volunteerId") Long volunteerId,
            @Param("status") ApplicationStatus status,
            Pageable pageable);

    @Query("SELECT COUNT(a) FROM EventApplication a WHERE a.volunteer.id = :volunteerId " +
           "AND a.status = :status AND a.event.startDate >= :since")
    long countByVolunteerAndStatusAndEventStartDateSince(
            @Param("volunteerId") Long volunteerId,
            @Param("status") ApplicationStatus status,
            @Param("since") LocalDateTime since);
}
