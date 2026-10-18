package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Trọng tài được BTC phân công cho giải đấu.
 * Mỗi trọng tài phụ trách một giải; không thuộc đội thi đấu.
 */
@Entity
@Table(name = "tournament_referees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentReferee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tournamentId;

    /** Tên trọng tài. */
    @Column(nullable = false, length = 80)
    private String name;

    /** Email tài khoản (nếu có). */
    @Column(length = 120)
    private String email;

    /** Số điện thoại liên hệ. */
    @Column(length = 20)
    private String phone;

    /** Trạng thái: ACTIVE / INACTIVE. */
    @Builder.Default
    private String status = "ACTIVE";

    /** Chứng chỉ / kinh nghiệm, tuỳ chọn. */
    @Column(length = 200)
    private String notes;

    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}