package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * CLB bóng đá — nhóm người dùng có chung tên CLB, dùng để quản lý đặt sân.
 *
 * <p>Mô hình phân quyền: người tạo CLB là <b>đại diện</b> (representative). Mỗi CLB có
 * nhiều thành viên, mỗi thành viên gắn với 1 tài khoản qua email. Vai trò được lưu ở
 * bảng {@code club_members} (role = REPRESENTATIVE | MEMBER).</p>
 */
@Entity
@Table(name = "clubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên CLB hiển thị, ví dụ "FC Đại Việt Đà Nẵng". */
    @Column(nullable = false, length = 100)
    private String name;

    /** Slug duy nhất để làm URL thân thiện (vd: /clubs/fc-dai-viet-da-nang). */
    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    /** Mô tả ngắn về CLB (màu áo, khu vực, giải đấu đang tham gia...). */
    @Column(length = 500)
    private String description;

    /** Khu vực hoạt động — luôn trong Đà Nẵng. */
    @Column(length = 120)
    private String area;

    /** Số điện thoại liên hệ của CLB. */
    @Column(length = 20)
    private String phone;

    /** Logo CLB (URL ảnh). */
    @Column(length = 500)
    private String logoUrl;

    /** Email người tạo = đại diện đầu tiên của CLB. */
    @Column(nullable = false, length = 120)
    private String ownerEmail;

    /** Tên hiển thị người tạo. */
    @Column(length = 80)
    private String ownerName;

    /** Số thành viên tối đa (0 = không giới hạn). */
    @Builder.Default
    private Integer maxMembers = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
