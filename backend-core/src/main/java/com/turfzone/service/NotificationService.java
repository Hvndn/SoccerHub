package com.turfzone.service;

import com.turfzone.model.Notification;
import com.turfzone.model.User;
import com.turfzone.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/** Gửi + đọc thông báo hệ thống. Lọc theo vai trò và email đăng nhập. */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void notify(String targetRole, String title, String message, String type, String link) {
        notify(targetRole, null, title, message, type, link);
    }

    public void notify(String targetRole, String targetEmail, String title, String message, String type, String link) {
        try {
            notificationRepository.save(Notification.builder()
                    .targetRole(targetRole != null ? targetRole : "ALL")
                    .targetEmail(targetEmail)
                    .title(title)
                    .message(message)
                    .type(type != null ? type : "SYSTEM")
                    .link(link)
                    .build());
        } catch (Exception e) {
            // Thông báo không được làm gãy nghiệp vụ chính
        }
    }

    /** Thông báo dành cho user đang đăng nhập: gửi cả nhóm role + gửi riêng ALL + đích danh. */
    public List<Notification> mine(User me) {
        String role = me.getRole() != null ? me.getRole().name() : "PLAYER";
        String email = me.getEmail() != null ? me.getEmail().toLowerCase() : "";
        return notificationRepository.findTop50ByOrderByIdDesc().stream()
                // CÓ đích danh email -> CHỈ người đó thấy (trước đây điều kiện được OR
                // nên thông báo cá nhân bị gửi cho cả nhóm vai trò).
                .filter(n -> {
                    String target = n.getTargetEmail();
                    if (target != null && !target.isBlank()) {
                        return target.equalsIgnoreCase(email);
                    }
                    return "ALL".equals(n.getTargetRole()) || role.equals(n.getTargetRole());
                })
                .limit(25)
                .collect(Collectors.toList());
    }
}
