package com.nayepankh.volunteerhub.dto.volunteer;

import com.nayepankh.volunteerhub.enums.BadgeLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class VolunteerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private boolean active;
    private BadgeLevel badgeLevel;
    private double totalHours;
    private LocalDateTime createdAt;
    private String college;
    private String city;
    private Integer age;
    private String bio;
    private String profileImage;
    private String availability;
    private List<SkillResponse> skills;
    private long certificatesEarned;
    private long eventsParticipated;
}
