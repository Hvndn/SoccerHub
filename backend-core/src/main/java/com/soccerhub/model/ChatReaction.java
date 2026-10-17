package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Emoji reaction gắn vào một tin nhắn (kiểu Messenger).
 * Mỗi user chỉ được reaction 1 emoji mỗi tin nhắn.
 */
@Entity
@Table(name = "chat_reactions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_email", "emoji"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = false)
    private Long messageId;

    @Column(name = "user_email", nullable = false, length = 120)
    private String userEmail;

    /** Mã emoji, ví dụ: "👍", "🔥", "⚽", "❤️", "😂", "👏". */
    @Column(nullable = false, length = 8)
    private String emoji;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}