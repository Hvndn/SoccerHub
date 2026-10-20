package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
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

    /**
     * Quyền tham gia giải do BTC/chủ sân quy định.
     *
     * <ul>
     *   <li>{@code PUBLIC} (mặc định) — ai cũng có thể đăng ký đội tham gia.</li>
     *   <li>{@code INVITE_ONLY} — chỉ những email trong {@link #invitedEmails} mới
     *       đăng ký được; dùng cho giải kín, giải phong trào nội bộ.</li>
     * </ul>
     */
    @Builder.Default
    private String joinMode = "PUBLIC"; // PUBLIC | INVITE_ONLY

    /** Danh sách email được mời tham gia (chỉ dùng khi joinMode = INVITE_ONLY). */
    @ElementCollection(fetch = FetchType.EAGER)
    @BatchSize(size = 100)
    @CollectionTable(name = "tournament_invited_emails", joinColumns = @JoinColumn(name = "tournament_id"))
    @Column(name = "email", length = 160)
    @Builder.Default
    private List<String> invitedEmails = new ArrayList<>();

    /** Thông tin nhận lệ phí giải (nullable — BTC điền khi tạo giải, dùng sinh QR VietQR). */
    private String bankCode;
    private String bankAccount;
    private String accountName;

    /** Kết quả bốc thăm chia cặp (JSON) — do BTC bấm "Bốc thăm" tạo ra, FE render cây nhánh từ đây. */
    @Column(columnDefinition = "TEXT")
    private String bracketJson;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Danh sách đội đã đăng ký.
     *
     * <p>{@code @BatchSize} rất quan trọng: nếu không có, mỗi lần {@code findAll()} sẽ bắn
     * 1 query riêng cho từng giải (14 giải = 14 query, mất ~80ms). Có BatchSize, Hibernate gom
     * hết vào 1 query {@code IN (tournament_ids)} — nhanh hơn nhiều khi BTC tạo giải / thêm đội.</p>
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @BatchSize(size = 100)
    @CollectionTable(name = "tournament_registered_teams", joinColumns = @JoinColumn(name = "tournament_id"))
    @Builder.Default
    private List<TournamentTeamEntry> teams = new ArrayList<>();
}
