package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.volunteer.*;
import com.nayepankh.volunteerhub.entity.*;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.exception.BadRequestException;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VolunteerService {

    private final UserRepository userRepository;
    private final VolunteerProfileRepository profileRepository;
    private final VolunteerSkillRepository volunteerSkillRepository;
    private final SkillRepository skillRepository;
    private final CertificateRepository certificateRepository;
    private final EventApplicationRepository applicationRepository;

    public Page<VolunteerResponse> getAllVolunteers(String search, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.searchVolunteers(Role.ROLE_VOLUNTEER, search, pageable);
        } else {
            users = userRepository.findByRole(Role.ROLE_VOLUNTEER, pageable);
        }
        return users.map(this::toResponse);
    }

    public VolunteerResponse getVolunteerById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", id));
        return toResponse(user);
    }

    @Transactional
    public VolunteerResponse updateProfile(Long userId, VolunteerProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        VolunteerProfile profile = profileRepository.findByUserId(userId)
                .orElse(VolunteerProfile.builder().user(user).build());
        if (req.getCollege() != null) profile.setCollege(req.getCollege());
        if (req.getCity() != null) profile.setCity(req.getCity());
        if (req.getAge() != null) profile.setAge(req.getAge());
        if (req.getBio() != null) profile.setBio(req.getBio());
        if (req.getProfileImage() != null) profile.setProfileImage(req.getProfileImage());
        if (req.getAvailability() != null) profile.setAvailability(req.getAvailability());
        profileRepository.save(profile);
        return toResponse(user);
    }

    @Transactional
    public SkillResponse addSkill(Long userId, SkillRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Skill skill = skillRepository.findById(req.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", req.getSkillId()));
        VolunteerSkill vs = VolunteerSkill.builder()
                .volunteer(user)
                .skill(skill)
                .proficiencyLevel(req.getProficiencyLevel())
                .build();
        vs = volunteerSkillRepository.save(vs);
        return SkillResponse.builder()
                .id(vs.getId())
                .skillId(skill.getId())
                .skillName(skill.getSkillName())
                .proficiencyLevel(vs.getProficiencyLevel())
                .build();
    }

    @Transactional
    public void removeSkill(Long userId, Long skillId) {
        volunteerSkillRepository.deleteByVolunteerIdAndSkillId(userId, skillId);
    }

    public List<SkillResponse> getSkills(Long userId) {
        return volunteerSkillRepository.findByVolunteerId(userId).stream()
                .map(vs -> SkillResponse.builder()
                        .id(vs.getId())
                        .skillId(vs.getSkill().getId())
                        .skillName(vs.getSkill().getSkillName())
                        .proficiencyLevel(vs.getProficiencyLevel())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    public VolunteerResponse toResponse(User user) {
        VolunteerProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        List<SkillResponse> skills = volunteerSkillRepository.findByVolunteerId(user.getId()).stream()
                .map(vs -> SkillResponse.builder()
                        .id(vs.getId())
                        .skillId(vs.getSkill().getId())
                        .skillName(vs.getSkill().getSkillName())
                        .proficiencyLevel(vs.getProficiencyLevel())
                        .build())
                .collect(Collectors.toList());

        VolunteerResponse.VolunteerResponseBuilder builder = VolunteerResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .badgeLevel(user.getBadgeLevel())
                .totalHours(user.getTotalHours())
                .createdAt(user.getCreatedAt())
                .skills(skills)
                .certificatesEarned(certificateRepository.countByVolunteerId(user.getId()))
                .eventsParticipated(applicationRepository.countByVolunteerIdAndStatus(user.getId(),
                        com.nayepankh.volunteerhub.enums.ApplicationStatus.APPROVED));

        if (profile != null) {
            builder.college(profile.getCollege())
                    .city(profile.getCity())
                    .age(profile.getAge())
                    .bio(profile.getBio())
                    .profileImage(profile.getProfileImage())
                    .availability(profile.getAvailability());
        }
        return builder.build();
    }
}
