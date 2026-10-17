package com.soccerhub.repository;

import com.soccerhub.model.TeamReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamReviewRepository extends JpaRepository<TeamReview, Long> {
    List<TeamReview> findByReviewedTeamNameOrderByCreatedAtDesc(String reviewedTeamName);

    /** Kiểm tra đã đánh giá bài đăng này chưa (mỗi đội chỉ chấm 1 lần). */
    boolean existsByMatchmakingPostIdAndReviewerTeamName(Long matchmakingPostId, String reviewerTeamName);

    /** Điểm trung bình sao của một đội. */
    @Query("SELECT AVG(r.stars) FROM TeamReview r WHERE r.reviewedTeamName = ?1")
    Double findAvgStarsByReviewedTeamName(String reviewedTeamName);

    /** Tổng số lượt đánh giá. */
    long countByReviewedTeamName(String reviewedTeamName);
}