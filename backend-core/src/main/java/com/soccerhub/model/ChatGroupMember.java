package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Thành viên của một phòng chat nhóm. */
@Entity
@Table(name = "chat_group_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "member_email"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatGroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "member_email", nullable = false, length = 120)
    private String memberEmail;

    @Column(name = "member_name", length = 80)
    private String memberName;

    /** true nếu người tạo nhóm. */
    @Builder.Default
    private Boolean isOwner = false;

    /** Thời điểm đọc tin mới nhất — dùng tính badge chưa đọc theo từng thiết bị. */
    @Builder.Default
    private LocalDateTime lastReadAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}