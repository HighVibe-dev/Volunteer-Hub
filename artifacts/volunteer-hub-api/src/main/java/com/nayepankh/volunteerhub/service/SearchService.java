package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.event.EventResponse;
import com.nayepankh.volunteerhub.dto.volunteer.VolunteerResponse;
import com.nayepankh.volunteerhub.entity.Certificate;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final CertificateRepository certificateRepository;
    private final VolunteerService volunteerService;
    private final EventService eventService;

    public SearchResult search(String query, String type, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        SearchResult result = new SearchResult();

        if (type == null || type.equals("volunteer")) {
            result.setVolunteers(userRepository.searchVolunteers(Role.ROLE_VOLUNTEER, query, pageable)
                    .stream().map(volunteerService::toResponse).collect(Collectors.toList()));
        }
        if (type == null || type.equals("event")) {
            result.setEvents(eventRepository.searchByTitle(query, pageable)
                    .stream().map(eventService::toResponse).collect(Collectors.toList()));
        }
        if (type == null || type.equals("certificate")) {
            Certificate cert = certificateRepository.findByCertificateNumber(query).orElse(null);
            if (cert != null) {
                result.setCertificateNumber(cert.getCertificateNumber());
                result.setCertificateId(cert.getId());
            }
        }
        return result;
    }

    @Data
    public static class SearchResult {
        private List<VolunteerResponse> volunteers;
        private List<EventResponse> events;
        private String certificateNumber;
        private Long certificateId;
    }
}
