package com.nayepankh.volunteerhub.dto.volunteer;

import com.nayepankh.volunteerhub.enums.ProficiencyLevel;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SkillResponse {
    private Long id;
    private Long skillId;
    private String skillName;
    private ProficiencyLevel proficiencyLevel;
}
