package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByVolunteerId(Long volunteerId);
    List<Certificate> findByEventId(Long eventId);
    Optional<Certificate> findByVolunteerIdAndEventId(Long volunteerId, Long eventId);
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
    boolean existsByVolunteerIdAndEventId(Long volunteerId, Long eventId);
    long countByVolunteerId(Long volunteerId);
}
