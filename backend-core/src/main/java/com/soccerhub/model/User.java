package com.soccerhub.model;

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

    @Builder.Default
    private Boolean enabled = true; // false = tài khoản bị admin khóa, không cho đăng nhập

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
