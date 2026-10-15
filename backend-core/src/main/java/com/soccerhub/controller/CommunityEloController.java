package com.soccerhub.controller;

import com.soccerhub.model.MatchmakingPost;
import com.soccerhub.repository.MatchmakingPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityEloController {

    private final MatchmakingPostRepository matchmakingPostRepository;
    private final com.soccerhub.repository.UserRepository userRepository;

    @GetMapping("/matchmaking-posts")
    public ResponseEntity<List<MatchmakingPost>> getMatchmakingPosts() {
        List<MatchmakingPost> posts = matchmakingPostRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/matchmaking-posts")
    public ResponseEntity<?> createMatchmakingPost(@RequestBody Map<String, Object> req) {
        String teamName = str(req.get("teamName"));
        String captainName = str(req.get("captainName"));
        String captainPhone = str(req.get("captainPhone"));
        String pitchName = str(req.get("pitchName"));
        String address = str(req.get("address"));
        String matchTime = str(req.get("matchTime"));

        // Không bịa dữ liệu khi client thiếu thông tin bắt buộc
        if (teamName == null || captainPhone == null || matchTime == null || pitchName == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Thiếu thông tin: cần teamName, captainPhone, matchTime và pitchName để đăng kèo."));
        }

        Integer eloRating = req.get("eloRating") != null ? Integer.parseInt(req.get("eloRating").toString()) : null;
        String pitchType = str(req.get("pitchType"));
        String paymentModel = str(req.get("paymentModel"));
        Long estimatedFee = req.get("estimatedFee") != null ? Long.parseLong(req.get("estimatedFee").toString()) : null;
        String note = str(req.get("note"));

        MatchmakingPost post = MatchmakingPost.builder()
                .teamName(teamName)
                .captainName(captainName != null ? captainName : captainPhone)
                .captainPhone(captainPhone)
                .eloRating(eloRating)
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
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/matchmaking-posts/{id}/accept")
    public ResponseEntity<?> acceptMatchmakingPost(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        MatchmakingPost post = matchmakingPostRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kèo giao lưu không tồn tại hoặc đã bị hủy"));
        }

        if (!"OPEN".equalsIgnoreCase(post.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kèo này đã có đội khác nhận!"));
        }

        String opponentTeamName = str(req.get("opponentTeamName"));
        String opponentCaptainName = str(req.get("opponentCaptainName"));
        String opponentCaptainPhone = str(req.get("opponentCaptainPhone"));
        Integer opponentElo = req.get("opponentElo") != null ? Integer.parseInt(req.get("opponentElo").toString()) : null;

        if (opponentTeamName == null || opponentCaptainPhone == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Thiếu thông tin đội nhận kèo: cần opponentTeamName và opponentCaptainPhone."));
        }

        post.setStatus("MATCHED");
        post.setOpponentTeamName(opponentTeamName);
        post.setOpponentCaptainName(opponentCaptainName != null ? opponentCaptainName : opponentCaptainPhone);
        post.setOpponentCaptainPhone(opponentCaptainPhone);
        post.setOpponentEloRating(opponentElo);
        post.setMatchedAt(LocalDateTime.now());

        matchmakingPostRepository.save(post);

        return ResponseEntity.ok(Map.of(
                "message", "Ghép kèo thành công! Chúc hai đội thi đấu Fairplay.",
                "post", post
        ));
    }

    /** Đọc chuỗi từ request; chuỗi rỗng/khoảng trắng coi như null. */
    private static String str(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    /** Chợ kèo khẩn cấp: lấy thật từ các bài đăng còn trạng thái OPEN trong bảng matchmaking_posts. */
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
            item.put("location", p.getPitchName() + (p.getAddress() != null ? " — " + p.getAddress() : ""));
            item.put("eloRequired", p.getEloRating());
            item.put("fee", p.getEstimatedFee());
            item.put("note", p.getNote());
            item.put("createdAt", p.getCreatedAt());
            market.add(item);
        }
        return ResponseEntity.ok(market);
    }

    /** Bảng xếp hạng Elo: lấy thật từ cột elo_rating của bảng users. */
    @GetMapping("/players/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getEloLeaderboard() {
        List<com.soccerhub.model.User> users = new ArrayList<>(userRepository.findAll());
        users.removeIf(u -> u.getEloRating() == null);
        users.sort((a, b) -> Integer.compare(b.getEloRating(), a.getEloRating()));

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (com.soccerhub.model.User u : users) {
            if (rank > 10) break;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", rank++);
            row.put("id", u.getId());
            row.put("name", u.getFullName());
            row.put("team", u.getArea());
            row.put("elo", u.getEloRating());
            row.put("level", u.getLevel());
            leaderboard.add(row);
        }
        return ResponseEntity.ok(leaderboard);
    }
}
