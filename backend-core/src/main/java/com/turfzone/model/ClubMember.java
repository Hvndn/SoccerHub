package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Thành viên của một CLB.
 *
 * <p>Mỗi thành viên gắn với 1 tài khoản qua email. Người có role
 * {@code REPRESENTATIVE} là <b>đại diện CLB</b> — được quản lý thành viên và cấu hình
 * quyền tham gia giải đấu.</p>
 */
@Entity
@Table(name = "club_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"club_id", "member_email"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "club_id", nullable = false)
    private Long clubId;

    /** Email tài khoản thành viên. */
    @Column(name = "member_email", nullable = false, length = 120)
    private String memberEmail;

    /** Tên hiển thị tại thời điểm thêm vào CLB. */
    @Column(name = "member_name", length = 80)
    private String memberName;

    /** Số điện thoại liên hệ của thành viên. */
    @Column(name = "member_phone", length = 20)
    private String memberPhone;

    /** true = đại diện CLB (được quản lý CLB), false = thành viên thường. */
    @Builder.Default
    private Boolean isRepresentative = false;

    /** true = thành viên đã xác nhận tham gia (tự đăng ký vào CLB đang mở). */
    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}
