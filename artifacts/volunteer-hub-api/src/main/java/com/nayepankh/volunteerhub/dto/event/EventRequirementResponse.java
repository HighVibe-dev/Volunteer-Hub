package com.nayepankh.volunteerhub.dto.event;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventRequirementResponse {
    private Long id;
    private Long skillId;
    private String skillName;
    private int requiredCount;
}
