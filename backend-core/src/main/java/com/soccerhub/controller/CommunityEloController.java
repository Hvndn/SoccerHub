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
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CommunityEloController {

    private final MatchmakingPostRepository matchmakingPostRepository;

    @GetMapping("/matchmaking-posts")
    public ResponseEntity<List<MatchmakingPost>> getMatchmakingPosts() {
        List<MatchmakingPost> posts = matchmakingPostRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/matchmaking-posts")
    public ResponseEntity<?> createMatchmakingPost(@RequestBody Map<String, Object> req) {
        String teamName = (String) req.getOrDefault("teamName", "FC Tự Do");
        String captainName = (String) req.getOrDefault("captainName", "Cầu Thủ");
        String captainPhone = (String) req.getOrDefault("captainPhone", "");
        Integer eloRating = req.get("eloRating") != null ? Integer.parseInt(req.get("eloRating").toString()) : 1200;
        String pitchName = (String) req.getOrDefault("pitchName", "Sân Bóng Đá");
        String address = (String) req.getOrDefault("address", "TP. Hồ Chí Minh");
        String matchTime = (String) req.getOrDefault("matchTime", "19:30 Tối nay");
        String pitchType = (String) req.getOrDefault("pitchType", "SAN_7");
        String paymentModel = (String) req.getOrDefault("paymentModel", "SPLIT_EQUAL");
        Long estimatedFee = req.get("estimatedFee") != null ? Long.parseLong(req.get("estimatedFee").toString()) : 50000L;
        String note = (String) req.getOrDefault("note", "Tìm kèo giao lưu cọ xát nâng trình, fairplay.");

        MatchmakingPost post = MatchmakingPost.builder()
                .teamName(teamName)
                .captainName(captainName)
                .captainPhone(captainPhone)
                .eloRating(eloRating)
                .reputationScore(98)
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

        String opponentTeamName = (String) req.getOrDefault("opponentTeamName", "FC Thách Đấu");
        String opponentCaptainName = (String) req.getOrDefault("opponentCaptainName", "Đội Trưởng Đối Thủ");
        String opponentCaptainPhone = (String) req.getOrDefault("opponentCaptainPhone", "");
        Integer opponentElo = req.get("opponentElo") != null ? Integer.parseInt(req.get("opponentElo").toString()) : 1200;

        post.setStatus("MATCHED");
        post.setOpponentTeamName(opponentTeamName);
        post.setOpponentCaptainName(opponentCaptainName);
        post.setOpponentCaptainPhone(opponentCaptainPhone);
        post.setOpponentEloRating(opponentElo);
        post.setMatchedAt(LocalDateTime.now());

        matchmakingPostRepository.save(post);

        return ResponseEntity.ok(Map.of(
                "message", "Ghép kèo thành công! Chúc hai đội thi đấu Fairplay.",
                "post", post
        ));
    }

    @GetMapping("/urgent-market")
    public ResponseEntity<List<Map<String, Object>>> getUrgentMarket() {
        List<Map<String, Object>> market = Arrays.asList(
            Map.of(
                "id", "urg-1",
                "matchTitle", "Trận Giao Hữu Sân 7 D-Sport Oasis",
                "time", "19:30 Tối nay (Còn 30 phút)",
                "location", "Sân D-Sport Oasis, Quận 7",
                "neededRoles", List.of("Thủ Môn (GK)", "Tiền Đạo Cánh (RW)"),
                "rewardNote", "Free 100% tiền sân + Nước uống giải khát",
                "urgencyLevel", "HIGH"
            ),
            Map.of(
                "id", "urg-2",
                "matchTitle", "Kèo Sân 5 Futsal Tân Bình",
                "time", "20:30 Tối nay",
                "location", "Chảo Lửa Tân Bình Arena",
                "neededRoles", List.of("Hậu vệ thòng (Fixer)"),
                "rewardNote", "Cộng 25 điểm Elo uy tín VFF",
                "urgencyLevel", "MEDIUM"
            )
        );
        return ResponseEntity.ok(market);
    }

    @GetMapping("/players/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getEloLeaderboard() {
        List<Map<String, Object>> leaderboard = Arrays.asList(
            Map.of("rank", 1, "name", "Nguyễn Văn Hùng", "team", "FC Saigon Warriors", "elo", 1580, "winRate", "78%", "reputation", 99, "goals", "18 bàn"),
            Map.of("rank", 2, "name", "Trần Tuấn Anh", "team", "FC Lộc Phát Q.7", "elo", 1520, "winRate", "72%", "reputation", 98, "goals", "15 bàn"),
            Map.of("rank", 3, "name", "Lê Hoàng Minh", "team", "FC Anh Em Kiến Trúc", "elo", 1490, "winRate", "69%", "reputation", 97, "goals", "14 bàn"),
            Map.of("rank", 4, "name", "Phạm Quốc Bảo", "team", "FC Titan Sài Gòn", "elo", 1440, "winRate", "65%", "reputation", 96, "goals", "12 bàn"),
            Map.of("rank", 5, "name", "Đặng Ngọc Long", "team", "FC Nam Sài Gòn", "elo", 1410, "winRate", "62%", "reputation", 95, "goals", "10 bàn")
        );
        return ResponseEntity.ok(leaderboard);
    }
}
