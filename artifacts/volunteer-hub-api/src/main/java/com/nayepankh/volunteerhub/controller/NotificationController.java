package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.notification.NotificationResponse;
import com.nayepankh.volunteerhub.exception.UnauthorizedException;
import com.nayepankh.volunteerhub.repository.NotificationRepository;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.service.NotificationService;
import com.nayepankh.volunteerhub.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications — always scoped to the authenticated user")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final JwtUtil jwtUtil;

    @GetMapping
    @Operation(summary = "Get MY notifications (JWT user — never another user's)")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest req) {
        Long userId = requireAuthenticatedUserId(req);
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUserNotifications(userId, PageRequest.of(page, size))));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get MY unread notification count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(HttpServletRequest req) {
        Long userId = requireAuthenticatedUserId(req);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark one of MY notifications as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            @PathVariable Long id,
            HttpServletRequest req) {
        Long userId = requireAuthenticatedUserId(req);
        requireNotificationOwner(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", notificationService.markRead(id)));
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all MY notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(HttpServletRequest req) {
        notificationService.markAllRead(requireAuthenticatedUserId(req));
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete one of MY notifications")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            HttpServletRequest req) {
        Long userId = requireAuthenticatedUserId(req);
        requireNotificationOwner(id, userId);
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Long requireAuthenticatedUserId(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            Long uid = jwtUtil.extractUserId(auth.substring(7));
            if (uid != null) return uid;
        }
        throw new UnauthorizedException("Authentication required");
    }

    private void requireNotificationOwner(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (!n.getUser().getId().equals(userId)) {
                throw new UnauthorizedException("You can only manage your own notifications");
            }
        });
    }
}
