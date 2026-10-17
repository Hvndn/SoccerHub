package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phòng chat nhóm (nhiều người, > 2 thành viên).
 * Khác với kênh công khai toàn cộng đồng (channel) và DM 1-1 (recipientEmail):
 * mỗi nhóm chỉ những thành viên được thêm mới đọc/gửi được.
 */
@Entity
@Table(name = "chat_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên nhóm hiển thị, ví dụ "Đội FC Bách Khoa - Chuẩn bị giải". */
    @Column(nullable = false, length = 80)
    private String name;

    /** Mô tả ngắn, tuỳ chọn. */
    @Column(length = 200)
    private String description;

    /** Email người tạo nhóm (chủ sở hữu, không thể bị xoá khỏi nhóm nếu còn thành viên khác). */
    @Column(nullable = false, length = 120)
    private String ownerEmail;

    /** Tên hiển thị người tạo. */
    @Column(length = 80)
    private String ownerName;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}