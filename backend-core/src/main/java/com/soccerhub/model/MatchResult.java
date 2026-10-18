package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Kết quả một trận đấu trong giải — nguồn thật để tính BXH và phong độ (lịch sử W/D/L). */
@Entity
@Table(name = "match_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tournamentId;

    @Column(nullable = false)
    private String matchId; // VD: R1-M1, R2-M1

    private String roundName;

    @Column(nullable = false)
    private String teamA;

    @Column(nullable = false)
    private String teamB;

    @Column(nullable = false)
    private Integer scoreA;

    @Column(nullable = false)
    private Integer scoreB;

    private String winner;

    // ---- Thống kê chi tiết trận đấu (thẻ, thay người, MVP) ----
    @Builder.Default
    private Integer yellowCardsA = 0;
    @Builder.Default
    private Integer yellowCardsB = 0;
    @Builder.Default
    private Integer redCardsA = 0;
    @Builder.Default
    private Integer redCardsB = 0;
    @Builder.Default
    private Integer substitutionsA = 0;
    @Builder.Default
    private Integer substitutionsB = 0;
    private String mvpPlayer;
    @Column(length = 500)
    private String notes;

    @Builder.Default
    private LocalDateTime playedAt = LocalDateTime.now();
}
