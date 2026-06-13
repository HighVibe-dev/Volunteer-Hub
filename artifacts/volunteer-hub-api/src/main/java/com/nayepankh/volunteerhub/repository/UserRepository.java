package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.User;
import com.nayepankh.volunteerhub.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Page<User> findByRole(Role role, Pageable pageable);
    List<User> findByRole(Role role);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.active = true AND " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchVolunteers(@Param("role") Role role, @Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.active = true")
    long countActiveByRole(@Param("role") Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") Role role);

    /**
     * Filter volunteers by optional city, availability, or skillId.
     * Uses a native query to avoid Hibernate null-parameter type inference issues with PostgreSQL.
     * DISTINCT to handle multiple volunteer_skills rows per user.
     */
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
                   "LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id " +
                   "LEFT JOIN volunteer_skills vs ON vs.volunteer_id = u.id " +
                   "WHERE u.role = 'ROLE_VOLUNTEER' " +
                   "AND (:city IS NULL OR LOWER(vp.city) = LOWER(CAST(:city AS TEXT))) " +
                   "AND (:availability IS NULL OR LOWER(vp.availability) = LOWER(CAST(:availability AS TEXT))) " +
                   "AND (:skillId IS NULL OR vs.skill_id = :skillId) " +
                   "ORDER BY u.created_at DESC",
           countQuery = "SELECT COUNT(DISTINCT u.id) FROM users u " +
                        "LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id " +
                        "LEFT JOIN volunteer_skills vs ON vs.volunteer_id = u.id " +
                        "WHERE u.role = 'ROLE_VOLUNTEER' " +
                        "AND (:city IS NULL OR LOWER(vp.city) = LOWER(CAST(:city AS TEXT))) " +
                        "AND (:availability IS NULL OR LOWER(vp.availability) = LOWER(CAST(:availability AS TEXT))) " +
                        "AND (:skillId IS NULL OR vs.skill_id = :skillId)",
           nativeQuery = true)
    Page<User> filterVolunteers(
            @Param("city") String city,
            @Param("availability") String availability,
            @Param("skillId") Long skillId,
            Pageable pageable);

    /**
     * Monthly volunteer sign-up count using native PostgreSQL DATE_TRUNC.
     * Returns rows of [truncated_month (Timestamp), count (Long)].
     */
    @Query(value = "SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS cnt " +
                   "FROM users WHERE role = 'ROLE_VOLUNTEER' AND created_at >= :since " +
                   "GROUP BY DATE_TRUNC('month', created_at) " +
                   "ORDER BY month",
           nativeQuery = true)
    List<Object[]> countMonthlyVolunteerGrowth(@Param("since") java.time.LocalDateTime since);
}
