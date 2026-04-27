package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.Notification;
import com.example.smartworkflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(@RequestAttribute("userId") UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Unread-Count", String.valueOf(unreadCount));

        return ResponseEntity.ok()
                .headers(headers)
                .body(notifications);
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, @RequestAttribute("userId") UUID userId) {
        Notification notification = notificationRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada o no autorizada"));

        notification.setIsRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllAsRead(@RequestAttribute("userId") UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> deleteAllRead(@RequestAttribute("userId") UUID userId) {
        // Borramos aquellas que ya se leyeron para mantener limpia la tabla (opcional)
        notificationRepository.deleteReadNotificationsByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
