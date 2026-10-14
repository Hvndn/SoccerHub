package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Thông báo hệ thống gửi theo vai trò hoặc đích danh email. */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ALL, PLAYER, OWNER, ORGANIZER, ADMIN */
    @Builder.Default
    private String targetRole = "ALL";

    /** Email đích danh (nullable — null nghĩa là gửi cả nhóm role). */
    private String targetEmail;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** BOOKING, TOURNAMENT, MATCH, SYSTEM */
    @Builder.Default
    private String type = "SYSTEM";

    /** Link điều hướng trong web (VD: /?tab=tournaments). Nullable. */
    private String link;

    @Builder.Default
    @Column(name = "is_read")
    private Boolean read = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
