package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.event.EventRequest;
import com.nayepankh.volunteerhub.dto.event.EventResponse;
import com.nayepankh.volunteerhub.dto.volunteer.VolunteerResponse;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.EventService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event management")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

    private final EventService eventService;
    private final JwtUtil jwtUtil;

    @GetMapping
    @Operation(summary = "List all events")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                eventService.getAllEvents(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID")
    public ResponseEntity<ApiResponse<EventResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEventById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Create a new event")
    public ResponseEntity<ApiResponse<EventResponse>> create(
            @Valid @RequestBody EventRequest req,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(ApiResponse.success("Event created", eventService.createEvent(req, userId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Update an event")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable Long id,
            @RequestBody EventRequest req,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(ApiResponse.success("Event updated", eventService.updateEvent(id, req, userId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an event")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, HttpServletRequest httpReq) {
        eventService.deleteEvent(id, extractUserId(httpReq));
        return ResponseEntity.ok(ApiResponse.success("Event deleted", null));
    }

    @GetMapping("/{id}/recommended-volunteers")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "Get skill-matched volunteer recommendations for an event")
    public ResponseEntity<ApiResponse<List<VolunteerResponse>>> recommend(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getRecommendedVolunteers(id)));
    }

    private Long extractUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }
}
