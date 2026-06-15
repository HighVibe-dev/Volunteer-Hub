package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.event.*;
import com.nayepankh.volunteerhub.dto.volunteer.VolunteerResponse;
import com.nayepankh.volunteerhub.entity.*;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventRequirementRepository requirementRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final VolunteerSkillRepository volunteerSkillRepository;
    private final EventApplicationRepository applicationRepository;
    private final AttendanceRepository attendanceRepository;
    private final VolunteerService volunteerService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<EventResponse> getAllEvents(Pageable pageable) {
        return eventRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
        return toResponse(event);
    }

    @Transactional
    public EventResponse createEvent(EventRequest req, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", creatorId));
        Event event = Event.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .location(req.getLocation())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .requiredVolunteers(req.getRequiredVolunteers())
                .status(req.getStatus())
                .createdBy(creator)
                .build();
        event = eventRepository.save(event);
        if (req.getRequirements() != null && !req.getRequirements().isEmpty()) {
            saveRequirements(event, req.getRequirements());
        }
        auditLogService.log(creatorId, "EVENT_CREATED", "Event: " + event.getTitle());
        return toResponse(event);
    }

    @Transactional
    public EventResponse updateEvent(Long id, EventRequest req, Long userId) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
        if (req.getTitle() != null) event.setTitle(req.getTitle());
        if (req.getDescription() != null) event.setDescription(req.getDescription());
        if (req.getLocation() != null) event.setLocation(req.getLocation());
        if (req.getStartDate() != null) event.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) event.setEndDate(req.getEndDate());
        if (req.getRequiredVolunteers() > 0) event.setRequiredVolunteers(req.getRequiredVolunteers());
        if (req.getStatus() != null) event.setStatus(req.getStatus());
        event = eventRepository.save(event);
        if (req.getRequirements() != null) {
            requirementRepository.deleteByEventId(id);
            saveRequirements(event, req.getRequirements());
        }
        auditLogService.log(userId, "EVENT_UPDATED", "Event: " + event.getTitle());
        return toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long id, Long userId) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
        requirementRepository.deleteByEventId(id);
        eventRepository.delete(event);
        auditLogService.log(userId, "EVENT_DELETED", "Event id: " + id);
    }

    /**
     * Add or replace skill requirements for an existing event.
     */
    @Transactional
    public EventResponse addRequirements(Long eventId, List<EventRequirementRequest> requirements, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));
        requirementRepository.deleteByEventId(eventId);
        saveRequirements(event, requirements);
        auditLogService.log(userId, "EVENT_REQUIREMENTS_UPDATED", "Event: " + event.getTitle());
        return toResponse(event);
    }

    /**
     * Recommend volunteers using a composite score:
     *   score = (skill proficiency match score × 40%)
     *         + (past approved-event participation count × 40%)
     *         + (attendance rate × 20%)
     * Returns top 20 ranked volunteers.
     */
    public List<VolunteerResponse> getRecommendedVolunteers(Long eventId) {
        List<EventRequirement> requirements = requirementRepository.findByEventId(eventId);
        if (requirements.isEmpty()) {
            return userRepository.findAll().stream()
                    .limit(10).map(volunteerService::toResponse).collect(Collectors.toList());
        }

        List<Long> requiredSkillIds = requirements.stream()
                .map(r -> r.getSkill().getId()).collect(Collectors.toList());

        List<VolunteerSkill> matchingSkills = volunteerSkillRepository.findBySkillIds(requiredSkillIds);

        // Skill score per volunteer (0–4 points per matching skill)
        Map<Long, Double> skillScores = new HashMap<>();
        for (VolunteerSkill vs : matchingSkills) {
            Long vid = vs.getVolunteer().getId();
            double proficiencyScore = switch (vs.getProficiencyLevel()) {
                case EXPERT -> 4.0;
                case ADVANCED -> 3.0;
                case INTERMEDIATE -> 2.0;
                case BEGINNER -> 1.0;
            };
            skillScores.merge(vid, proficiencyScore, Double::sum);
        }

        // Gather all candidate volunteer IDs (those with any matching skill)
        Set<Long> candidateIds = new HashSet<>(skillScores.keySet());

        // Build composite scores
        Map<Long, Double> compositeScores = new HashMap<>();
        long maxSkillScore = Math.max(1, requirements.size() * 4L);
        long maxParticipation = 1; // will be updated below

        Map<Long, Long> participationCounts = new HashMap<>();
        Map<Long, Double> attendanceRates = new HashMap<>();

        for (Long vid : candidateIds) {
            long participated = applicationRepository.countByVolunteerIdAndStatus(vid, ApplicationStatus.APPROVED);
            participationCounts.put(vid, participated);
            if (participated > maxParticipation) maxParticipation = participated;

            long totalAttendance = attendanceRepository.countTotalAttendanceByVolunteerId(vid);
            long presentCount = attendanceRepository.countEventsAttendedByVolunteerId(vid);
            double rate = totalAttendance > 0 ? (double) presentCount / totalAttendance : 0.0;
            attendanceRates.put(vid, rate);
        }

        final long finalMaxPart = maxParticipation;
        for (Long vid : candidateIds) {
            double normalizedSkill = skillScores.getOrDefault(vid, 0.0) / maxSkillScore;
            double normalizedPart = (double) participationCounts.getOrDefault(vid, 0L) / finalMaxPart;
            double rate = attendanceRates.getOrDefault(vid, 0.0);

            double score = (normalizedSkill * 0.40) + (normalizedPart * 0.40) + (rate * 0.20);
            compositeScores.put(vid, score);
        }

        return compositeScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(20)
                .map(e -> userRepository.findById(e.getKey()).orElse(null))
                .filter(Objects::nonNull)
                .map(volunteerService::toResponse)
                .collect(Collectors.toList());
    }

    private void saveRequirements(Event event, List<EventRequirementRequest> reqs) {
        for (EventRequirementRequest r : reqs) {
            Skill skill = skillRepository.findById(r.getSkillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill", r.getSkillId()));
            EventRequirement req = EventRequirement.builder()
                    .event(event).skill(skill).requiredCount(r.getRequiredCount()).build();
            requirementRepository.save(req);
        }
    }

    public EventResponse toResponse(Event event) {
        List<EventRequirement> reqs = requirementRepository.findByEventId(event.getId());
        List<EventRequirementResponse> reqResponses = reqs.stream()
                .map(r -> EventRequirementResponse.builder()
                        .id(r.getId())
                        .skillId(r.getSkill().getId())
                        .skillName(r.getSkill().getSkillName())
                        .requiredCount(r.getRequiredCount())
                        .build())
                .collect(Collectors.toList());

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .location(event.getLocation())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .requiredVolunteers(event.getRequiredVolunteers())
                .status(event.getStatus())
                .createdById(event.getCreatedBy() != null ? event.getCreatedBy().getId() : null)
                .createdByName(event.getCreatedBy() != null ? event.getCreatedBy().getName() : null)
                .createdAt(event.getCreatedAt())
                .requirements(reqResponses)
                .applicantCount(applicationRepository.countByEventId(event.getId()))
                .approvedCount(applicationRepository.countByEventIdAndStatus(event.getId(), ApplicationStatus.APPROVED))
                .build();
    }
}
