package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.User;
import com.nayepankh.volunteerhub.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    @Query("SELECT u.createdAt, COUNT(u) FROM User u WHERE u.role = 'ROLE_VOLUNTEER' AND u.createdAt >= :since GROUP BY FUNCTION('MONTH', u.createdAt), FUNCTION('YEAR', u.createdAt) ORDER BY u.createdAt")
    List<Object[]> countMonthlyVolunteerGrowth(@Param("since") LocalDateTime since);
}
