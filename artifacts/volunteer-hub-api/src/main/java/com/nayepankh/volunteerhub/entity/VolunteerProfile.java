package com.nayepankh.volunteerhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "volunteer_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VolunteerProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String college;
    private String city;
    private Integer age;

    @Column(length = 1000)
    private String bio;

    private String profileImage;
    private String availability;
}
