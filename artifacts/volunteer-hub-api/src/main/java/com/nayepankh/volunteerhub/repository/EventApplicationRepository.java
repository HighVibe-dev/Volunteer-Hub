package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.EventApplication;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
