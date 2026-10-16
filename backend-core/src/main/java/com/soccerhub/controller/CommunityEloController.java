package com.soccerhub.controller;

import com.soccerhub.model.MatchmakingPost;
import com.soccerhub.repository.MatchmakingPostRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.service.TeamFormService;
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
    private final TournamentRepository tournamentRepository;
    private final TeamFormService teamFormService;

    @GetMapping("/matchmaking-posts")
    public ResponseEntity<List<MatchmakingPost>> getMatchmakingPosts() {
        List<MatchmakingPost> posts = matchmakingPostRepository.findAllByOrderByCreatedAtDesc();
        posts.forEach(this::attachForm);
        return ResponseEntity.ok(posts);
    }

    /** Gắn phong độ live của đội đăng kèo — không lưu DB. */
    private void attachForm(MatchmakingPost p) {
        if (p == null || p.getTeamName() == null) return;
        TeamFormService.FormRecord f = teamFormService.formOf(p.getTeamName());
        p.setForm(f.form());
        p.setRecord(f.record());
        p.setWinRate(f.winRate());
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
                // eloRating client gửi lên (nếu có) được giữ nguyên để tương thích ngược,
                // nhưng hệ thống không còn dùng để gợi ý/xếp hạng — phong độ tính từ lịch sử.
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
        attachForm(saved);
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
        // opponentElo (nếu client cũ gửi) được bỏ qua: nhận kèo không còn xét điểm số.

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

    /**
     * Bảng phong độ đội bóng: gom mọi tên đội từng đăng ký giải, tính thành tích
     * + chuỗi 5 trận gần nhất từ lịch sử thi đấu thật, xếp theo tỷ lệ thắng.
     * Thay thế BXH Elo cũ — không còn điểm số, chỉ lịch sử trực quan.
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
}
