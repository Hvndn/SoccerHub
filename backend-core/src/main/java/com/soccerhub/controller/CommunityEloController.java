package com.soccerhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/community")
@CrossOrigin(origins = "*")
public class CommunityEloController {

    @GetMapping("/matchmaking-posts")
    public ResponseEntity<List<Map<String, Object>>> getMatchmakingPosts() {
        List<Map<String, Object>> posts = Arrays.asList(
            Map.of(
                "id", "post-1",
                "teamName", "FC Phù Đổng Q7",
                "eloRating", 1350,
                "reputationScore", 98,
                "pitchName", "Cụm Sân ProHub Q7",
                "matchTime", "20:00 Hôm nay",
                "pitchType", "Sân 7",
                "status", "WAITING_OPPONENT",
                "note", "Cần tìm đối đá bắt cọc tiền sân 50/50, fairplay không quạu."
            ),
            Map.of(
                "id", "post-2",
                "teamName", "FC Bách Khoa",
                "eloRating", 1210,
                "reputationScore", 95,
                "pitchName", "Sân Phú Nhuận Arena",
                "matchTime", "18:30 Ngày mai",
                "pitchType", "Sân 5",
                "status", "WAITING_OPPONENT",
                "note", "Tìm kèo cọ xát nâng trình Elo, giao lưu vui vẻ."
            )
        );
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/urgent-market")
    public ResponseEntity<List<Map<String, Object>>> getUrgentMarket() {
        List<Map<String, Object>> market = Arrays.asList(
            Map.of(
                "id", "urg-1",
                "matchTitle", "Trận Giao Hữu Sân 7 Q7",
                "time", "19:00 Hôm nay (Còn 45 phút)",
                "location", "Sân ProHub Q7",
                "neededRoles", List.of("Thủ Môn (GK)", "Tiền Đạo (ST)"),
                "rewardNote", "Hỗ trợ 50k tiền nước + Free tiền sân",
                "urgencyLevel", "HIGH"
            ),
            Map.of(
                "id", "urg-2",
                "matchTitle", "Giải Tứ Hùng Tân Bình",
                "time", "20:30 Hôm nay",
                "location", "Tân Bình Stadium",
                "neededRoles", List.of("Hậu vệ thòng (CB)"),
                "rewardNote", "Cộng 15 điểm Elo uy tín",
                "urgencyLevel", "MEDIUM"
            )
        );
        return ResponseEntity.ok(market);
    }

    @GetMapping("/players/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getEloLeaderboard() {
        List<Map<String, Object>> leaderboard = Arrays.asList(
            Map.of("rank", 1, "name", "Nguyễn Văn Hùng (Cap FC Tigers)", "elo", 1580, "winRate", "78%", "reputation", 99),
            Map.of("rank", 2, "name", "Trần Tuấn Anh (FC Phù Đổng)", "elo", 1520, "winRate", "72%", "reputation", 98),
            Map.of("rank", 3, "name", "Lê Hoàng Minh (FC Warriors)", "elo", 1490, "winRate", "69%", "reputation", 97),
            Map.of("rank", 4, "name", "Phạm Quốc Bảo (FC Dragons)", "elo", 1440, "winRate", "65%", "reputation", 96)
        );
        return ResponseEntity.ok(leaderboard);
    }
}
