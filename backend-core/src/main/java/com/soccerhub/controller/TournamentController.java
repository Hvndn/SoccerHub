package com.soccerhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/tournaments")
@CrossOrigin(origins = "*")
public class TournamentController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTournaments() {
        List<Map<String, Object>> list = Arrays.asList(
            Map.of(
                "id", "tourn-1",
                "title", "Giải Bóng Đá Vô Địch Sinh Viên SoccerHub Cup 2026",
                "format", "KNOCKOUT",
                "teamCount", 8,
                "status", "ONGOING",
                "startDate", "2026-09-20",
                "bannerUrl", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
            ),
            Map.of(
                "id", "tourn-2",
                "title", "Giải Giao Hữu Các Câu Lạc Bộ Doanh Nghiệp Q7",
                "format", "ROUND_ROBIN",
                "teamCount", 6,
                "status", "UPCOMING",
                "startDate", "2026-10-01",
                "bannerUrl", "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80"
            )
        );
        return ResponseEntity.ok(list);
    }

    @PostMapping("/generate-bracket")
    public ResponseEntity<Map<String, Object>> generateTournamentBracket(@RequestBody Map<String, Object> req) {
        String title = (String) req.getOrDefault("title", "Giải Đấu Mới");
        String format = (String) req.getOrDefault("format", "KNOCKOUT");
        List<String> teams = (List<String>) req.getOrDefault("teams", List.of("FC Tigers", "FC Dragons", "FC Warriors", "FC Phoenix", "FC Lions", "FC Sharks", "FC Eagles", "FC Titans"));

        Collections.shuffle(teams);

        List<Map<String, Object>> quarterFinals = new ArrayList<>();
        for (int i = 0; i < teams.size(); i += 2) {
            quarterFinals.add(Map.of(
                "matchId", "Q-" + (i / 2 + 1),
                "teamA", teams.get(i),
                "teamB", teams.get(i + 1),
                "scoreA", 0,
                "scoreB", 0,
                "status", "SCHEDULED"
            ));
        }

        List<Map<String, Object>> semiFinals = Arrays.asList(
            Map.of("matchId", "SF-1", "teamA", "Thắng Q1", "teamB", "Thắng Q2", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED"),
            Map.of("matchId", "SF-2", "teamA", "Thắng Q3", "teamB", "Thắng Q4", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED")
        );

        Map<String, Object> finalMatch = Map.of("matchId", "FINAL", "teamA", "Thắng SF1", "teamB", "Thắng SF2", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED");

        Map<String, Object> bracketResult = Map.of(
            "tournamentId", "tourn-" + System.currentTimeMillis() % 1000,
            "title", title,
            "format", format,
            "totalTeams", teams.size(),
            "bracketTree", Map.of(
                "quarterFinals", quarterFinals,
                "semiFinals", semiFinals,
                "final", finalMatch
            ),
            "standings", List.of(
                Map.of("rank", 1, "team", "FC Tigers", "played", 3, "won", 3, "draw", 0, "loss", 0, "goalsDiff", "+7", "points", 9),
                Map.of("rank", 2, "team", "FC Warriors", "played", 3, "won", 2, "draw", 0, "loss", 1, "goalsDiff", "+3", "points", 6),
                Map.of("rank", 3, "team", "FC Dragons", "played", 3, "won", 1, "draw", 0, "loss", 2, "goalsDiff", "-2", "points", 3),
                Map.of("rank", 4, "team", "FC Phoenix", "played", 3, "won", 0, "draw", 0, "loss", 3, "goalsDiff", "-8", "points", 0)
            )
        );

        return ResponseEntity.ok(bracketResult);
    }
}
