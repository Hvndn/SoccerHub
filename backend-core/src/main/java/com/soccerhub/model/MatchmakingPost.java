package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matchmaking_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchmakingPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String teamName;

    private String captainName;
    private String captainPhone;

    @Builder.Default
    private Integer eloRating = 1200;

    @Builder.Default
    private Integer reputationScore = 98;

    @Column(nullable = false)
    private String pitchName;

    private String address;

    @Column(nullable = false)
    private String matchTime; // Ví dụ: "19:30 Tối nay", "20:00 Ngày mai"

    @Builder.Default
    private String pitchType = "SAN_7"; // SAN_7, SAN_5, SAN_11, FUTSAL

    @Builder.Default
    private String paymentModel = "SPLIT_EQUAL"; // SPLIT_EQUAL (Chia đôi 50/50), LOSER_PAYS (Thua chịu), HOST_COVER (Bao trọn)

    @Builder.Default
    private Long estimatedFee = 50000L; // Tiền dự kiến mỗi người / mỗi đội

    @Column(columnDefinition = "TEXT")
    private String note;

    @Builder.Default
    private String status = "OPEN"; // OPEN, MATCHED, CANCELLED

    // Thông tin đối thủ nhận kèo
    private String opponentTeamName;
    private String opponentCaptainName;
    private String opponentCaptainPhone;
    private Integer opponentEloRating;
    private LocalDateTime matchedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
