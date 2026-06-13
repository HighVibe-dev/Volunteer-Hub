package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.volunteer.*;
import com.nayepankh.volunteerhub.service.VolunteerService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/volunteers")
@RequiredArgsConstructor
@Tag(name = "Volunteers", description = "Volunteer profile and skill management")
@SecurityRequirement(name = "bearerAuth")
public class VolunteerController {

    private final VolunteerService volunteerService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('COORDINATOR')")
    @Operation(summary = "List all volunteers (admin/coordinator)")
    public ResponseEntity<ApiResponse<Page<VolunteerResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                volunteerService.getAllVolunteers(search, PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get volunteer by ID")
    public ResponseEntity<ApiResponse<VolunteerResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getVolunteerById(id)));
    }

    @PutMapping("/{id}/profile")
    @Operation(summary = "Update volunteer profile")
    public ResponseEntity<ApiResponse<VolunteerResponse>> updateProfile(
            @PathVariable Long id,
            @RequestBody VolunteerProfileRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", volunteerService.updateProfile(id, req)));
    }

    @GetMapping("/{id}/skills")
    @Operation(summary = "Get volunteer skills")
    public ResponseEntity<ApiResponse<List<SkillResponse>>> getSkills(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getSkills(id)));
    }

    @PostMapping("/{id}/skills")
    @Operation(summary = "Add skill to volunteer")
    public ResponseEntity<ApiResponse<SkillResponse>> addSkill(
            @PathVariable Long id,
            @RequestBody SkillRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Skill added", volunteerService.addSkill(id, req)));
    }

    @DeleteMapping("/{id}/skills/{skillId}")
    @Operation(summary = "Remove skill from volunteer")
    public ResponseEntity<ApiResponse<Void>> removeSkill(@PathVariable Long id, @PathVariable Long skillId) {
        volunteerService.removeSkill(id, skillId);
        return ResponseEntity.ok(ApiResponse.success("Skill removed", null));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle volunteer active status")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        volunteerService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Status toggled", null));
    }
}
