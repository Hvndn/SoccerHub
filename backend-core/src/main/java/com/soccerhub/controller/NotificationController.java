package com.soccerhub.controller;

import com.soccerhub.model.Notification;
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

    /**
     * Đánh dấu đã đọc. Ngoài việc yêu cầu đăng nhập, phải kiểm tra thông báo
     * này có thực sự dành cho mình hay không — nếu không thì bất kỳ tài khoản
     * nào cũng đánh dấu đã đọc được thông báo của người khác.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, @AuthenticationPrincipal User me) {
        if (me == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        }

        Notification found = notificationRepository.findById(id).orElse(null);
        if (found == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy thông báo."));
        }

        boolean isAdmin = me.getRole() != null && "ADMIN".equals(me.getRole().name());
        String myRole = me.getRole() != null ? me.getRole().name() : "PLAYER";
        String myEmail = me.getEmail() != null ? me.getEmail().toLowerCase() : "";

        boolean forMe = "ALL".equals(found.getTargetRole())
                || myRole.equals(found.getTargetRole())
                || (found.getTargetEmail() != null && found.getTargetEmail().equalsIgnoreCase(myEmail));

        if (!forMe && !isAdmin) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền thao tác thông báo này."));
        }

        found.setRead(true);
        notificationRepository.save(found);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc.", "id", id));
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
