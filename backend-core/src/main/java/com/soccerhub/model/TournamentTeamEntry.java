package com.soccerhub.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Transient;
import lombok.*;
import java.time.LocalDateTime;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentTeamEntry {
    private String teamName;
    private String captainName;
    private String captainPhone;
    private String subCaptainPhone;
    private Integer memberCount;
    private Integer eloRating;
    // --- Phong độ tính live từ match_results (KHÔNG lưu DB, tính mỗi lần đọc) ---
    @Transient
    private String form;
    @Transient
    private String record;
    @Transient
    private Integer winRate;
    @Transient
    private Integer played;
    @Transient
    private Integer won;
    @Transient
    private Integer drawn;
    @Transient
    private Integer lost;
    @Builder.Default
    private String registrationStatus = "CONFIRMED"; // PENDING_PAYMENT, CONFIRMED, SIMULATED
    @Builder.Default
    private Boolean simulated = false; // true = đội do nút "Giả lập đủ đội (Test)" sinh ra
    @Builder.Default
    private LocalDateTime registeredAt = LocalDateTime.now();
}
