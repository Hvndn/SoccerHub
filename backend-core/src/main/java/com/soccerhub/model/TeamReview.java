package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Đánh giá uy tín / Fair-play giữa 2 đội sau trận giao hữu.
 * Mỗi đội chỉ được chấm 1 lần cho mỗi bài đăng (matchmakingPostId).
 */
@Entity
@Table(name = "team_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Đội bị đánh giá (đội nhận kèo hoặc đội đăng). */
    @Column(nullable = false, length = 80)
    private String reviewedTeamName;

    /** Đội đánh giá. */
    @Column(nullable = false, length = 80)
    private String reviewerTeamName;

    /** Bài đăng matchmaking liên quan (nullable cho đánh giá tự do). */
    private Long matchmakingPostId;

    /** Số sao tổng thể 1-5. */
    @Column(nullable = false)
    private Integer stars;

    /** Đúng giờ (không trễ). */
    @Builder.Default
    private Boolean onTime = true;

    /** Sòng phẳng (chia tiền đúng thỏa thuận). */
    @Builder.Default
    private Boolean fairPlay = true;

    /** Tinh thần thể thao (không chơi xấu, chấp nhận kết quả). */
    @Builder.Default
    private Boolean sportsmanship = true;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}