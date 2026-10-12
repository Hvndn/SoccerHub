package com.soccerhub.model;

import jakarta.persistence.Embeddable;
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
    @Builder.Default
    private String registrationStatus = "CONFIRMED"; // PENDING_PAYMENT, CONFIRMED
    @Builder.Default
    private LocalDateTime registeredAt = LocalDateTime.now();
}
