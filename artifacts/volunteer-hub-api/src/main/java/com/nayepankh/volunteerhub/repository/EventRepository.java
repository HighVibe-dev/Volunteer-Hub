package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.Event;
import com.nayepankh.volunteerhub.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findByStatus(EventStatus status, Pageable pageable);
    List<Event> findByCreatedById(Long userId);
    long countByStatus(EventStatus status);

    @Query("SELECT e FROM Event e WHERE LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Event> searchByTitle(@Param("search") String search, Pageable pageable);

    /**
     * Monthly event count using native PostgreSQL DATE_TRUNC.
     * Returns rows of [truncated_month (Timestamp), count (Long)].
     */
    @Query(value = "SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS cnt " +
                   "FROM events WHERE created_at >= :since " +
                   "GROUP BY DATE_TRUNC('month', created_at) " +
                   "ORDER BY month",
           nativeQuery = true)
    List<Object[]> countMonthlyEvents(@Param("since") LocalDateTime since);

    @Query("SELECT e FROM Event e WHERE e.status = 'UPCOMING' OR e.status = 'ACTIVE' ORDER BY e.startDate ASC")
    List<Event> findUpcomingEvents();
}
