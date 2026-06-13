package com.nayepankh.volunteerhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "event_requirements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Builder.Default
    private int requiredCount = 1;
}
