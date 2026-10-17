package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tin nhắn trong phòng chat cộng đồng.
 * Thiết kế tối giản: một phòng chat công khai cho mọi người dùng đã đăng nhập.
 * (Mở rộng sau: thêm conversationId để làm chat 1-1 nếu cần.)
 */
@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên hiển thị của người gửi (lấy từ tài khoản). */
    @Column(nullable = false, length = 80)
    private String senderName;

    /** Email người gửi — dùng để phân biệt "tin của tôi" ở frontend. */
    @Column(nullable = false, length = 120)
    private String senderEmail;

    /** Vai trò người gửi (PLAYER/OWNER/ORGANIZER/ADMIN) để tô màu tên. */
    @Column(length = 20)
    private String senderRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}