package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.event.EventApplicationResponse;
import com.nayepankh.volunteerhub.entity.*;
import com.nayepankh.volunteerhub.enums.ApplicationStatus;
import com.nayepankh.volunteerhub.exception.BadRequestException;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventApplicationService {

    private final EventApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional
    public EventApplicationResponse apply(Long volunteerId, Long eventId) {
        if (applicationRepository.existsByVolunteerIdAndEventId(volunteerId, eventId)) {
            throw new BadRequestException("Already applied to this event");
        }
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", volunteerId));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));

        EventApplication app = EventApplication.builder()
                .volunteer(volunteer).event(event).build();
        app = applicationRepository.save(app);
        return toResponse(app);
    }

    @Transactional
    public EventApplicationResponse updateStatus(Long applicationId, ApplicationStatus status, Long coordinatorId) {
        EventApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
        app.setStatus(status);
        app = applicationRepository.save(app);

        String msg = status == ApplicationStatus.APPROVED
                ? "Your application for \"" + app.getEvent().getTitle() + "\" has been approved!"
                : "Your application for \"" + app.getEvent().getTitle() + "\" was not selected this time.";
        notificationService.createNotification(app.getVolunteer().getId(), "Application Update", msg);
        auditLogService.log(coordinatorId, "APPLICATION_" + status.name(),
                "Application " + applicationId + " for event " + app.getEvent().getTitle());

        return toResponse(app);
    }

    public Page<EventApplicationResponse> getApplicationsByEvent(Long eventId, Pageable pageable) {
        return applicationRepository.findByEventId(eventId, pageable).map(this::toResponse);
    }

    public Page<EventApplicationResponse> getApplicationsByVolunteer(Long volunteerId, Pageable pageable) {
        return applicationRepository.findByVolunteerId(volunteerId, pageable).map(this::toResponse);
    }

    private EventApplicationResponse toResponse(EventApplication app) {
        return EventApplicationResponse.builder()
                .id(app.getId())
                .volunteerId(app.getVolunteer().getId())
                .volunteerName(app.getVolunteer().getName())
                .volunteerEmail(app.getVolunteer().getEmail())
                .eventId(app.getEvent().getId())
                .eventTitle(app.getEvent().getTitle())
                .applicationDate(app.getApplicationDate())
                .status(app.getStatus())
                .build();
    }
}
