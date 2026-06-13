package com.nayepankh.volunteerhub.dto.event;

import lombok.Data;

@Data
public class EventRequirementRequest {
    private Long skillId;
    private int requiredCount = 1;
}
