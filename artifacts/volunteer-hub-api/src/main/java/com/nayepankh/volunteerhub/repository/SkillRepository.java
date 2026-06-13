package com.nayepankh.volunteerhub.repository;

import com.nayepankh.volunteerhub.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
    List<Skill> findBySkillNameContainingIgnoreCase(String name);
    boolean existsBySkillNameIgnoreCase(String skillName);
}
