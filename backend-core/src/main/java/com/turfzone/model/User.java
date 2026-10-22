package com.turfzone.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private String fullName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private String position;

    private String area;

    private String favoriteSport;

    private String level;

    private String avatar;

    // Chỉ số hồ sơ cầu thủ — do người dùng tự khai báo trong Hồ Sơ VĐV, lưu trong bảng users
    private String dominantFoot;
    private String jerseyNumber;
    private String height;
    private String weight;
    private String preferredTime;
    private String currentClub;
    /**
     * Da hoan tat buoc khoi tao ho so cau thu?
     * <p>null = tai khoan cu (khong can khoi tao), false = vua dang ky, can
     * hoan thanh trang "Khoi tao ho so cau thu". Truoc day giao dien phu thuoc
     * vao co localStorage -> mat co khi xoa cache / doi thiet bi thi nguoi dung
     * khong bao gio duoc yeu cau khoi tao ho so.</p>
     */
    private Boolean profileCompleted;

    @Builder.Default
    private Boolean enabled = true; // false = tài khoản bị admin khóa, không cho đăng nhập

    /**
     * Cờ "đại diện CLB" — người dùng này đại diện cho ít nhất 1 CLB (được gán quyền
     * quản lý thành viên, cấu hình quyền tham gia giải đấu cho CLB).
     *
     * <p>Giữ nguyên role chính của tài khoản (PLAYER/OWNER/...); cờ này chỉ bổ sung
     * thêm vai trò, không tạo role mới.</p>
     */
    @Builder.Default
    private Boolean isClubRep = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
