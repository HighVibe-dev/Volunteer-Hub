package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.EventRequirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRequirementRepository extends JpaRepository<EventRequirement, Long> {
    List<EventRequirement> findByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}
