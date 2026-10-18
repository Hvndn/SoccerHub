package com.soccerhub.controller;

import com.soccerhub.model.MatchmakingPost;
import com.soccerhub.model.TeamReview;
import com.soccerhub.repository.MatchmakingPostRepository;
import com.soccerhub.repository.TeamReviewRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.service.TeamFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * API Cộng đồng: Chợ kèo giao hữu, Chợ kèo khẩn cấp, BXH phong độ và Đánh giá Fair-play.
 *
 * <p>Hệ thống KHÔNG dùng điểm Elo. Mọi xếp hạng đều tính trực tiếp từ lịch sử
 * thi đấu thật ({@link TeamFormService}) và điểm uy tín Fair-play
 * ({@code reputationScore}).</p>
 */
@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final MatchmakingPostRepository matchmakingPostRepository;
    private final TeamReviewRepository teamReviewRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamFormService teamFormService;

    // =====================================================================
    // CHỢ KẸO GIAO HỮU
    // =====================================================================

    @GetMapping("/matchmaking-posts")
    public ResponseEntity<List<MatchmakingPost>> getMatchmakingPosts() {
        List<MatchmakingPost> posts = matchmakingPostRepository.findAllByOrderByCreatedAtDesc();
        posts.forEach(this::attachForm);
        return ResponseEntity.ok(posts);
    }

    /** Gắn phong độ live của đội đăng kèo (không lưu DB). */
    private void attachForm(MatchmakingPost p) {
        if (p == null || p.getTeamName() == null) return;
        TeamFormService.FormRecord f = teamFormService.formOf(p.getTeamName());
        p.setForm(f.form());
        p.setRecord(f.record());
        p.setWinRate(f.winRate());
    }

    @PostMapping("/matchmaking-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createMatchmakingPost(@RequestBody Map<String, Object> req) {
        String teamName = str(req.get("teamName"));
        String captainName = str(req.get("captainName"));
        String captainPhone = str(req.get("captainPhone"));
        String pitchName = str(req.get("pitchName"));
        String address = str(req.get("address"));
        String matchTime = str(req.get("matchTime"));

        // Không bịt lỗi luồng UI thhiếu thông tin bắt buộc
        if (teamName == null || captainPhone == null || matchTime == null || pitchName == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Thiếu thông tin: cần teamName, captainPhone, matchTime và pitchName để đăng kèo."));
        }

        String pitchType = str(req.get("pitchType"));
        String paymentModel = str(req.get("paymentModel"));
        Long estimatedFee = req.get("estimatedFee") != null ? Long.parseLong(req.get("estimatedFee").toString()) : null;
        String note = str(req.get("note"));

        MatchmakingPost post = MatchmakingPost.builder()
                .teamName(teamName)
                .captainName(captainName != null ? captainName : captainPhone)
                .captainPhone(captainPhone)
                .pitchName(pitchName)
                .address(address)
                .matchTime(matchTime)
                .pitchType(pitchType)
                .paymentModel(paymentModel)
                .estimatedFee(estimatedFee)
                .note(note)
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .build();

        MatchmakingPost saved = matchmakingPostRepository.save(post);
        attachForm(saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/matchmaking-posts/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> acceptMatchmakingPost(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        MatchmakingPost post = matchmakingPostRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kèo giao lưu không tồn tại hoặc đã hủy"));
        }

        if (!"OPEN".equalsIgnoreCase(post.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kèo này đã có đối thủ nhận!"));
        }

        String opponentTeamName = str(req.get("opponentTeamName"));
        String opponentCaptainName = str(req.get("opponentCaptainName"));
        String opponentCaptainPhone = str(req.get("opponentCaptainPhone"));

        if (opponentTeamName == null || opponentCaptainPhone == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Thiếu thông tin đội nhận kèo: cần opponentTeamName và opponentCaptainPhone."));
        }

        post.setStatus("MATCHED");
        post.setOpponentTeamName(opponentTeamName);
        post.setOpponentCaptainName(opponentCaptainName != null ? opponentCaptainName : opponentCaptainPhone);
        post.setOpponentCaptainPhone(opponentCaptainPhone);
        post.setMatchedAt(LocalDateTime.now());

        matchmakingPostRepository.save(post);

        return ResponseEntity.ok(Map.of(
                "message", "Ghép kèo thành công! Chúc hai đội thi đấu Fairplay.",
                "post", post
        ));
    }

    /** Chuỗi rỗng/khoảng trắng coi như null. */
    private static String str(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    // =====================================================================
    // CHỢ KẸO KHẨN CẤP
    // =====================================================================

    /** Chợ kèo khẩn cấp: lấy thật từ các bài đăng trong bảng matchmaking_posts có trạng thái OPEN. */
    @GetMapping("/urgent-market")
    public ResponseEntity<List<Map<String, Object>>> getUrgentMarket() {
        List<Map<String, Object>> market = new ArrayList<>();
        for (MatchmakingPost p : matchmakingPostRepository.findAllByOrderByCreatedAtDesc()) {
            if (!"OPEN".equalsIgnoreCase(p.getStatus())) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("matchTitle", p.getTeamName() + " cần đối thủ");
            item.put("teamName", p.getTeamName());
            item.put("captainName", p.getCaptainName());
            item.put("time", p.getMatchTime());
            item.put("location", p.getPitchName() + (p.getAddress() != null ? " • " + p.getAddress() : ""));
            TeamFormService.FormRecord f = teamFormService.formOf(p.getTeamName());
            item.put("form", f.form());
            item.put("record", f.record());
            item.put("winRate", f.winRate());
            item.put("fee", p.getEstimatedFee());
            item.put("note", p.getNote());
            item.put("createdAt", p.getCreatedAt());
            market.add(item);
        }
        return ResponseEntity.ok(market);
    }

    // =====================================================================
    // BẢNG XẾP HẠNG PHONG ĐỘ (không dùng Elo)
    // =====================================================================

    /**
     * BXH phong độ đội bóng: gom mọi tên đội từ giải đăng ký, tính thành tích
     * + chuỗi 5 trận gần nhất từ lịch sử thi đấu thật, xếp theo tỷ lệ thắng.
     */
    @GetMapping("/players/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getFormLeaderboard() {
        Set<String> teamNames = new LinkedHashSet<>();
        for (com.soccerhub.model.Tournament t : tournamentRepository.findAll()) {
            if (t.getTeams() == null) continue;
            for (com.soccerhub.model.TournamentTeamEntry e : t.getTeams()) {
                if (e.getTeamName() != null && !e.getTeamName().isBlank()) {
                    teamNames.add(e.getTeamName());
                }
            }
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (String name : teamNames) {
            TeamFormService.FormRecord f = teamFormService.formOf(name);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("teamName", name);
            row.putAll(f.toMap());
            rows.add(row);
        }
        rows.sort((a, b) -> {
            int c = Integer.compare((int) b.get("winRate"), (int) a.get("winRate"));
            if (c != 0) return c;
            c = Integer.compare((int) b.get("played"), (int) a.get("played"));
            if (c != 0) return c;
            return String.valueOf(a.get("teamName")).compareTo(String.valueOf(b.get("teamName")));
        });

        List<Map<String, Object>> board = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> r : rows) {
            if (rank > 10) break;
            r.put("rank", rank++);
            board.add(r);
        }
        return ResponseEntity.ok(board);
    }

    // =====================================================================
    // ĐÁNH GIÁ UY TÍN / FAIR-PLAY
    // =====================================================================

    /**
     * Chấm điểm Fair-play cho một đội sau trận giao hữu.
     * Mỗi đội chỉ được chấm 1 lần cho mỗi bài đăng (matchmakingPostId).
     * Sau khi chấm, reputationScore của đội bị đánh giá được tính lại và cập nhật.
     */
    @PostMapping("/reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> req) {
        String reviewedTeam = str(req.get("reviewedTeamName"));
        String reviewerTeam = str(req.get("reviewerTeamName"));
        if (reviewedTeam == null || reviewerTeam == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu tên đội bị đánh giá / đội đánh giá."));
        }
        if (reviewedTeam.equalsIgnoreCase(reviewerTeam)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không thể tự đánh giá đội của mình."));
        }

        Long postId = null;
        if (req.get("matchmakingPostId") != null) {
            try { postId = Long.parseLong(req.get("matchmakingPostId").toString()); } catch (NumberFormatException ignored) { }
        }

        // Mỗi đội chỉ chấm 1 lần cho mỗi bài đăng
        if (postId != null && teamReviewRepository.existsByMatchmakingPostIdAndReviewerTeamName(postId, reviewerTeam)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã đánh giá bài đăng này rồi."));
        }

        int stars = 5;
        if (req.get("stars") != null) {
            try { stars = Math.max(1, Math.min(5, Integer.parseInt(req.get("stars").toString()))); } catch (NumberFormatException ignored) { }
        }
        boolean onTime = parseBool(req.get("onTime"), true);
        boolean fairPlay = parseBool(req.get("fairPlay"), true);
        boolean sportsmanship = parseBool(req.get("sportsmanship"), true);
        String comment = str(req.get("comment"));

        TeamReview review = TeamReview.builder()
                .reviewedTeamName(reviewedTeam)
                .reviewerTeamName(reviewerTeam)
                .matchmakingPostId(postId)
                .stars(stars)
                .onTime(onTime)
                .fairPlay(fairPlay)
                .sportsmanship(sportsmanship)
                .comment(comment)
                .build();
        teamReviewRepository.save(review);

        // Cập nhật reputationScore của đội bị đánh giá
        updateReputationScore(reviewedTeam);

        return ResponseEntity.ok(Map.of(
                "message", "Đã gửi đánh giá Fair-play cho đội " + reviewedTeam + ".",
                "review", review
        ));
    }

    /** Lấy danh sách đánh giá của một đội (mới nhất trước). */
    @GetMapping("/reviews/{teamName}")
    public ResponseEntity<Map<String, Object>> getReviews(@PathVariable String teamName) {
        List<TeamReview> reviews = teamReviewRepository.findByReviewedTeamNameOrderByCreatedAtDesc(teamName);
        Double avg = teamReviewRepository.findAvgStarsByReviewedTeamName(teamName);
        long count = teamReviewRepository.countByReviewedTeamName(teamName);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teamName", teamName);
        result.put("avgStars", avg == null ? 0 : Math.round(avg * 10.0) / 10.0);
        result.put("reviewCount", count);
        result.put("reviews", reviews);
        return ResponseEntity.ok(result);
    }

    /** Tính lại reputationScore của đội từ tất cả đánh giá Fair-play. */
    private void updateReputationScore(String teamName) {
        Double avg = teamReviewRepository.findAvgStarsByReviewedTeamName(teamName);
        if (avg == null) return;

        // Tỷ lệ Fair-play = (onTime + fairPlay + sportsmanship) / (số đánh giá * 3)
        List<TeamReview> reviews = teamReviewRepository.findByReviewedTeamNameOrderByCreatedAtDesc(teamName);
        double fairRate = 0;
        if (!reviews.isEmpty()) {
            int fairCount = 0;
            for (TeamReview r : reviews) {
                if (Boolean.TRUE.equals(r.getOnTime())) fairCount++;
                if (Boolean.TRUE.equals(r.getFairPlay())) fairCount++;
                if (Boolean.TRUE.equals(r.getSportsmanship())) fairCount++;
            }
            fairRate = fairCount / (double) (reviews.size() * 3);
        }

        // reputationScore = 0.6 * (avgStars/5 * 100) + 0.4 * (fairRate * 100), clamp 0-100
        int score = (int) Math.round(0.6 * (avg / 5.0 * 100) + 0.4 * (fairRate * 100));
        score = Math.max(0, Math.min(100, score));

        // Cập nhật reputationScore trong các bài đăng của đội
        for (MatchmakingPost p : matchmakingPostRepository.findAll()) {
            if (p.getTeamName() != null && p.getTeamName().equalsIgnoreCase(teamName)) {
                p.setReputationScore(score);
                matchmakingPostRepository.save(p);
            }
        }
    }

    private static boolean parseBool(Object v, boolean def) {
        if (v == null) return def;
        if (v instanceof Boolean) return (Boolean) v;
        String s = v.toString().trim().toLowerCase();
        if (s.equals("true") || s.equals("1") || s.equals("yes")) return true;
        if (s.equals("false") || s.equals("0") || s.equals("no")) return false;
        return def;
    }
}