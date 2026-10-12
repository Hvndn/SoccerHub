package com.soccerhub.controller;

import com.soccerhub.model.Tournament;
import com.soccerhub.model.TournamentTeamEntry;
import com.soccerhub.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/tournaments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentRepository tournamentRepository;

    @GetMapping
    public ResponseEntity<List<Tournament>> getTournaments() {
        List<Tournament> tournaments = tournamentRepository.findAll();
        return ResponseEntity.ok(tournaments);
    }

    @PostMapping
    public ResponseEntity<Tournament> createTournament(@RequestBody Tournament tournament) {
        if (tournament.getRegisteredTeams() == null) {
            tournament.setRegisteredTeams(0);
        }
        if (tournament.getStatus() == null) {
            tournament.setStatus("OPEN");
        }
        if (tournament.getCreatedAt() == null) {
            tournament.setCreatedAt(LocalDateTime.now());
        }
        Tournament saved = tournamentRepository.save(tournament);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTournamentById(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerTeam(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu không tồn tại"));
        }

        if (tournament.getTotalTeams() != null && tournament.getRegisteredTeams() >= tournament.getTotalTeams()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu đã đủ số lượng đội đăng ký"));
        }

        String teamName = (String) req.getOrDefault("teamName", "FC Tân Binh");
        String captainName = (String) req.getOrDefault("captainName", "Cầu Thủ");
        String captainPhone = (String) req.getOrDefault("captainPhone", "");
        String subCaptainPhone = (String) req.getOrDefault("subCaptainPhone", "");
        Integer memberCount = req.get("memberCount") != null ? Integer.parseInt(req.get("memberCount").toString()) : 12;
        Integer eloRating = req.get("eloRating") != null ? Integer.parseInt(req.get("eloRating").toString()) : 1200;

        TournamentTeamEntry entry = TournamentTeamEntry.builder()
                .teamName(teamName)
                .captainName(captainName)
                .captainPhone(captainPhone)
                .subCaptainPhone(subCaptainPhone)
                .memberCount(memberCount)
                .eloRating(eloRating)
                .registrationStatus("CONFIRMED")
                .registeredAt(LocalDateTime.now())
                .build();

        tournament.getTeams().add(entry);
        tournament.setRegisteredTeams(tournament.getTeams().size());
        tournamentRepository.save(tournament);

        return ResponseEntity.ok(Map.of(
                "message", "Đăng ký giải đấu thành công!",
                "tournamentId", tournament.getId(),
                "registeredTeams", tournament.getRegisteredTeams(),
                "team", entry
        ));
    }

    @PostMapping("/generate-bracket")
    public ResponseEntity<Map<String, Object>> generateTournamentBracket(@RequestBody Map<String, Object> req) {
        String title = (String) req.getOrDefault("title", "Giải Đấu Mới");
        String format = (String) req.getOrDefault("format", "KNOCKOUT");
        List<String> teams = (List<String>) req.getOrDefault("teams", List.of(
                "FC Tigers", "FC Dragons", "FC Warriors", "FC Phoenix",
                "FC Lions", "FC Sharks", "FC Eagles", "FC Titans"
        ));

        List<String> shuffled = new ArrayList<>(teams);
        Collections.shuffle(shuffled);

        List<Map<String, Object>> quarterFinals = new ArrayList<>();
        for (int i = 0; i < shuffled.size() - 1; i += 2) {
            quarterFinals.add(Map.of(
                    "matchId", "Q-" + (i / 2 + 1),
                    "teamA", shuffled.get(i),
                    "teamB", shuffled.get(i + 1),
                    "scoreA", 0,
                    "scoreB", 0,
                    "status", "SCHEDULED"
            ));
        }

        List<Map<String, Object>> semiFinals = Arrays.asList(
                Map.of("matchId", "SF-1", "teamA", "Thắng Q1", "teamB", "Thắng Q2", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED"),
                Map.of("matchId", "SF-2", "teamA", "Thắng Q3", "teamB", "Thắng Q4", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED")
        );

        Map<String, Object> finalMatch = Map.of(
                "matchId", "FINAL", "teamA", "Thắng SF1", "teamB", "Thắng SF2", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED"
        );

        Map<String, Object> bracketResult = Map.of(
                "tournamentId", "tourn-" + System.currentTimeMillis() % 1000,
                "title", title,
                "format", format,
                "totalTeams", shuffled.size(),
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
