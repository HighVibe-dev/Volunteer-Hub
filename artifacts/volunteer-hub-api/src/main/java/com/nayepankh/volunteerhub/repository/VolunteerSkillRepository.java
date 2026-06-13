package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.VolunteerSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VolunteerSkillRepository extends JpaRepository<VolunteerSkill, Long> {
    List<VolunteerSkill> findByVolunteerId(Long volunteerId);
    void deleteByVolunteerIdAndSkillId(Long volunteerId, Long skillId);

    @Query("SELECT vs FROM VolunteerSkill vs WHERE vs.skill.id IN :skillIds")
    List<VolunteerSkill> findBySkillIds(@Param("skillIds") List<Long> skillIds);

    @Query("SELECT vs.skill.skillName, COUNT(vs) FROM VolunteerSkill vs GROUP BY vs.skill.skillName ORDER BY COUNT(vs) DESC")
    List<Object[]> getSkillDistribution();
}
