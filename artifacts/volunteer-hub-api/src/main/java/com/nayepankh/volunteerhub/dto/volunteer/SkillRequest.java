package com.nayepankh.volunteerhub.dto.volunteer;

import com.nayepankh.volunteerhub.enums.ProficiencyLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SkillRequest {
    @NotNull
    private Long skillId;
    private ProficiencyLevel proficiencyLevel = ProficiencyLevel.BEGINNER;
}
