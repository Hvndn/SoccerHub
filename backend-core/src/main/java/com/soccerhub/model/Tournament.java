package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournaments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private String sportType = "SAN_7"; // SAN_7, SAN_5, SAN_11, FUTSAL

    @Builder.Default
    private String format = "KNOCKOUT"; // KNOCKOUT, ROUND_ROBIN

    private String pitchName;
    private String location;

    private Integer totalTeams;
    
    @Builder.Default
    private Integer registeredTeams = 0;

    private Long prizePool; // Tiền thưởng (VNĐ)
    private Long entryFee;   // Lệ phí tham gia mỗi đội (VNĐ)

    private String startDate;
    private String endDate;
    private String registrationDeadline;

    @Builder.Default
    private String status = "OPEN"; // OPEN, ONGOING, COMPLETED

    private String bannerUrl;

    /** Kết quả bốc thăm chia cặp (JSON) — do BTC bấm "Bốc thăm" tạo ra, FE render cây nhánh từ đây. */
    @Column(columnDefinition = "TEXT")
    private String bracketJson;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tournament_registered_teams", joinColumns = @JoinColumn(name = "tournament_id"))
    @Builder.Default
    private List<TournamentTeamEntry> teams = new ArrayList<>();
}
