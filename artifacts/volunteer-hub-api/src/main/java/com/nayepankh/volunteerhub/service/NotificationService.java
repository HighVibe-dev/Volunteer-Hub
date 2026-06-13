package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.notification.NotificationResponse;
import com.nayepankh.volunteerhub.entity.Notification;
import com.nayepankh.volunteerhub.entity.User;
import com.nayepankh.volunteerhub.exception.ResourceNotFoundException;
import com.nayepankh.volunteerhub.repository.NotificationRepository;
import com.nayepankh.volunteerhub.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Async
    public void createNotification(Long userId, String title, String message) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            Notification n = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(message)
                    .build();
            notificationRepository.save(n);
        } catch (Exception ignored) {}
    }

    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        n.setRead(true);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
