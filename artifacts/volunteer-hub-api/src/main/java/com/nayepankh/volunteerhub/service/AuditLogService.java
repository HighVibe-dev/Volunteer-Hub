package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.entity.AuditLog;
import com.nayepankh.volunteerhub.entity.User;
import com.nayepankh.volunteerhub.repository.AuditLogRepository;
import com.nayepankh.volunteerhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Async
    public void log(Long userId, String action, String details) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            AuditLog log = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .details(details)
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception ignored) {}
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<AuditLog> getUserLogs(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
}
