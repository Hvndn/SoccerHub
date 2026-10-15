package com.soccerhub.controller;

import com.soccerhub.model.User;
import com.soccerhub.repository.NotificationRepository;
import com.soccerhub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Thông báo hệ thống cho user đã đăng nhập + broadcast của ADMIN. */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @GetMapping("/mine")
    public ResponseEntity<?> mine(@AuthenticationPrincipal User me) {
        if (me == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        }
        return ResponseEntity.ok(notificationService.mine(me));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, @AuthenticationPrincipal User me) {
        if (me == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        }
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                    return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc.", "id", id));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy thông báo.")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    notificationRepository.delete(n);
                    return ResponseEntity.ok(Map.of("message", "Đã xóa thông báo.", "id", id));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy thông báo.")));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> broadcast(@RequestBody Map<String, Object> body) {
        String title = String.valueOf(body.getOrDefault("title", "")).trim();
        String message = String.valueOf(body.getOrDefault("message", "")).trim();
        if (title.isEmpty() || message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu tiêu đề hoặc nội dung."));
        }
        String targetRole = String.valueOf(body.getOrDefault("targetRole", "ALL")).trim().toUpperCase();
        if (!java.util.Set.of("ALL", "PLAYER", "OWNER", "ORGANIZER", "ADMIN").contains(targetRole)) {
            targetRole = "ALL";
        }
        notificationService.notify(targetRole, title, message, "SYSTEM",
                body.get("link") != null ? String.valueOf(body.get("link")) : null);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo tới nhóm " + targetRole + "."));
    }
}
