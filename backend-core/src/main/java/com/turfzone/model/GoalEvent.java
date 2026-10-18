package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Một dòng ghi nhận cầu thủ ghi bàn/kiến tạo trong một trận đấu của giải. */
@Entity
@Table(name = "goal_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tournamentId;

    @Column(nullable = false)
    private String matchId; // VD: R1-M1

    @Column(nullable = false)
    private String playerName;

    @Column(nullable = false)
    private String teamName;

    @Builder.Default
    private Integer goals = 0;

    @Builder.Default
    private Integer assists = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
