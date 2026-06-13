package com.nayepankh.volunteerhub.dto.volunteer;

import lombok.Data;

@Data
public class VolunteerProfileRequest {
    private String college;
    private String city;
    private Integer age;
    private String bio;
    private String profileImage;
    private String availability;
}
