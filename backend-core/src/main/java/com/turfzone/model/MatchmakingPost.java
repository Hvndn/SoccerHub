package com.turfzone.model;

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

    // --- SOS Mượn Chân / Tìm Viện Binh Giờ Chót ---
    @Builder.Default
    private String postType = "MATCH"; // "MATCH" (Kèo giao hữu) hoặc "SOS_GUEST" (Mượn chân / tìm viện binh)

    @Builder.Default
    private String neededPosition = "BAT_KY"; // THU_MON, HAU_VE, TIEN_VE, TIEN_DAO, BAT_KY

    @Builder.Default
    private Integer neededCount = 1;

    @Builder.Default
    private Integer joinedCount = 0;

    // --- Thỏa thuận kèo giao hữu (Match Terms Agreement) ---
    @Builder.Default
    private String matchStyle = "DUONG_SINH"; // "DUONG_SINH" (Văn phòng dưỡng sinh), "NHIET_HUYET" (Cọ xát nhiệt huyết)

    @Builder.Default
    private String ageGroup = "U25_U35"; // "U20_U25", "U25_U35", "U35_PLUS"

    @Builder.Default
    private String homeKitColor = "Đỏ"; // Màu áo đội tạo kèo

    private String awayKitColor; // Màu áo đội nhận kèo

    @Builder.Default
    private String refereeOption = "TU_BAT"; // "TU_BAT" (Hai đội tự bắt fairplay), "THUE_TRONG_TAI" (Thuê trọng tài sân)

    @Builder.Default
    private String waterOption = "CAM_THUNG"; // "CAM_THUNG" (Cưa đôi thùng nước), "TU_MANG" (Tự túc)

    // --- Phong độ live của đội đăng kèo (tính từ match_results, KHÔNG lưu DB) ---
    @Transient
    private String form;
    @Transient
    private String record;
    @Transient
    private Integer winRate;

    // Thông tin đối thủ nhận kèo
    private String opponentTeamName;
    private String opponentCaptainName;
    private String opponentCaptainPhone;
    private LocalDateTime matchedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
