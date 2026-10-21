package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Nhật ký thao tác của Quản Trị viên (Super Admin).
 *
 * <p>Mỗi khi admin khóa/mở khóa tài khoản, đổi vai trò, xóa người dùng, xóa giải đấu,
 * gỡ tin nhắn hay gửi thông báo hệ thống... đều được ghi lại để truy vết và đối chiếu.
 * Đây là cơ chế "ai đã làm gì, vào lúc nào" — yêu cầu cơ bản của một hệ thống quản trị.</p>
 */
@Entity
@Table(name = "admin_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Email tài khoản admin thực hiện thao tác. */
    @Column(nullable = false, length = 120)
    private String adminEmail;

    /** Tên hiển thị của admin (snapshot tại thời điểm thao tác). */
    private String adminName;

    /**
     * Nhóm thao tác để lọc nhanh:
     * USER / TOURNAMENT / PITCH / BOOKING / CHAT / MATCHMAKING / NOTIFICATION / SYSTEM.
     */
    @Column(nullable = false, length = 40)
    private String actionGroup;

    /** Hành động cụ thể, ví dụ LOCK_USER, CHANGE_ROLE, DELETE_TOURNAMENT. */
    @Column(nullable = false, length = 60)
    private String action;

    /** Đối tượng bị tác động (email user, tên giải, id tin nhắn...). */
    @Column(length = 160)
    private String target;

    /** Mô tả chi tiết bằng tiếng Việt để hiển thị cho người quản trị. */
    @Column(length = 400)
    private String detail;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}