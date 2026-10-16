package com.soccerhub.model;

import jakarta.persistence.Column;
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
    /**
     * Danh sách thành viên (tên cách nhau bằng dấu phẩy). Đội giả lập sinh tự động
     * đúng quân số theo thể thức sân; đội thật do đội trưởng khai khi đăng ký.
     */
    @Column(length = 2000)
    private String memberNames;
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
