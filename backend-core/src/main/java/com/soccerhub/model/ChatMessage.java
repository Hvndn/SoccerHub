package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tin nhắn trong phòng chat cộng đồng HOẶC tin nhắn trực tiếp (DM) giữa 2 người.
 * - recipientEmail = null  → tin nhắn công khai (mọi người đều thấy)
 * - recipientEmail != null → tin nhắn riêng giữa sender và recipient
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

    /** Email người gửi — dùng để phân biệt "tin của tôi". */
    @Column(nullable = false, length = 120)
    private String senderEmail;

    /** Vai trò người gửi (PLAYER/OWNER/ORGANIZER/ADMIN) để tô màu tên. */
    @Column(length = 20)
    private String senderRole;

    /** Email người nhận. null = tin công khai (mọi người). */
    @Column(length = 120)
    private String recipientEmail;

    /** Tên người nhận (để hiển thị). */
    @Column(length = 80)
    private String recipientName;

    /**
     * Slug của kênh phòng chat công khai. null/"general" = phòng chat chung.
     * Ví dụ: "general", "vang-lai", "bu-thieu-nguoi", "doi-30p", "tinh-trang-san",
     *          "khieu-nai", "ho-dap-luat", "do-dung-cu", "tuyen-cau-thu".
     */
    @Column(length = 40)
    @Builder.Default
    private String channel = "general";

    /**
     * Id phòng chat nhóm. null = không phải tin trong nhóm.
     * Khi có groupId thì recipientEmail phải null (tin nhóm, không phải DM).
     */
    private Long groupId;

    /** Id tin nhắn được trả lời (null = tin thường). */
    private Long replyToId;

    /** Tin ghim cho kênh (chỉ 1 tin ghim mỗi kênh). */
    @Builder.Default
    private Boolean pinned = false;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}