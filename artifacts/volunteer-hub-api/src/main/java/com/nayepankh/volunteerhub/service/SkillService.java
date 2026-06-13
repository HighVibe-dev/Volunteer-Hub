package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.entity.Skill;
import com.nayepankh.volunteerhub.exception.BadRequestException;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    public Skill createSkill(String skillName) {
        if (skillRepository.existsBySkillNameIgnoreCase(skillName)) {
            throw new BadRequestException("Skill already exists: " + skillName);
        }
        return skillRepository.save(Skill.builder().skillName(skillName).build());
    }

    public Skill getSkillById(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", id));
    }

    public void deleteSkill(Long id) {
        skillRepository.deleteById(id);
    }
}
